import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Calculator, RotateCcw } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface PartnershipAuditThresholdCalculatorProps {
  forceLanguage?: 'en' | 'bn';
  className?: string;
}

const TURNOVER_THRESHOLD_CRORE = 10;
const CAPITAL_THRESHOLD_CRORE = 5;

const SECTION_1_PRESETS = [
  {
    id: 'ex1',
    en: 'Example 1 (12 Cr / 2 Cr)',
    bn: 'উদাহরণ ১ (১২ কোটি / ২ কোটি)',
    turnoverCr: 12,
    capitalCr: 2,
  },
  {
    id: 'ex2',
    en: 'Example 2 (8 Cr / 6 Cr)',
    bn: 'উদাহরণ ২ (৮ কোটি / ৬ কোটি)',
    turnoverCr: 8,
    capitalCr: 6,
  },
  {
    id: 'ex3',
    en: 'Example 3 (7 Cr / 3 Cr)',
    bn: 'উদাহরণ ৩ (৭ কোটি / ৩ কোটি)',
    turnoverCr: 7,
    capitalCr: 3,
  },
  {
    id: 'exact',
    en: 'Exact Limit (10 Cr / 5 Cr)',
    bn: 'ঠিক সীমা (১০ কোটি / ৫ কোটি)',
    turnoverCr: 10,
    capitalCr: 5,
  },
];

export const PartnershipAuditThresholdCalculator: React.FC<
  PartnershipAuditThresholdCalculatorProps
> = ({ forceLanguage, className = '' }) => {
  const { language } = useLanguage();
  const isBn = (forceLanguage ?? language) === 'bn';

  const [unit, setUnit] = useState<'crore' | 'bdt'>('crore');
  const [turnoverInput, setTurnoverInput] = useState<string>('12');
  const [capitalInput, setCapitalInput] = useState<string>('2');

  const handleUnitChange = (nextUnit: 'crore' | 'bdt') => {
    if (nextUnit === unit) return;
    const tVal = Number.parseFloat(turnoverInput);
    const cVal = Number.parseFloat(capitalInput);

    if (nextUnit === 'bdt') {
      setTurnoverInput(Number.isFinite(tVal) ? String(Math.round(tVal * 10_000_000)) : '');
      setCapitalInput(Number.isFinite(cVal) ? String(Math.round(cVal * 10_000_000)) : '');
    } else {
      setTurnoverInput(
        Number.isFinite(tVal) ? String(Number((tVal / 10_000_000).toFixed(2))) : ''
      );
      setCapitalInput(
        Number.isFinite(cVal) ? String(Number((cVal / 10_000_000).toFixed(2))) : ''
      );
    }
    setUnit(nextUnit);
  };

  const applyPreset = (turnoverCr: number, capitalCr: number) => {
    if (unit === 'crore') {
      setTurnoverInput(String(turnoverCr));
      setCapitalInput(String(capitalCr));
    } else {
      setTurnoverInput(String(turnoverCr * 10_000_000));
      setCapitalInput(String(capitalCr * 10_000_000));
    }
  };

  const handleClear = () => {
    setTurnoverInput('');
    setCapitalInput('');
  };

  const evaluation = useMemo(() => {
    const hasTurnover = turnoverInput.trim() !== '';
    const hasCapital = capitalInput.trim() !== '';

    if (!hasTurnover && !hasCapital) {
      return { status: 'empty' as const };
    }

    const rawTurnover = Math.max(0, Number.parseFloat(turnoverInput) || 0);
    const rawCapital = Math.max(0, Number.parseFloat(capitalInput) || 0);

    const turnoverCr = unit === 'crore' ? rawTurnover : rawTurnover / 10_000_000;
    const capitalCr = unit === 'crore' ? rawCapital : rawCapital / 10_000_000;

    const exceedsTurnover = turnoverCr > TURNOVER_THRESHOLD_CRORE;
    const exceedsCapital = capitalCr > CAPITAL_THRESHOLD_CRORE;
    const isExactBoundary =
      !exceedsTurnover &&
      !exceedsCapital &&
      (turnoverCr === TURNOVER_THRESHOLD_CRORE || capitalCr === CAPITAL_THRESHOLD_CRORE);

    if (exceedsTurnover || exceedsCapital) {
      const triggerDetail =
        exceedsTurnover && exceedsCapital
          ? isBn
            ? `বার্ষিক টার্নওভার (BDT ${turnoverCr.toFixed(2)} কোটি > ১০ কোটি) এবং মূলধন (BDT ${capitalCr.toFixed(2)} কোটি > ৫ কোটি)—উভয় সীমাই অতিক্রম করেছে।`
            : `Both Annual Turnover (BDT ${turnoverCr.toFixed(2)} crore > 10 crore) and Capital (BDT ${capitalCr.toFixed(2)} crore > 5 crore) exceed the Section 73(1) thresholds.`
          : exceedsTurnover
          ? isBn
            ? `বার্ষিক টার্নওভার (BDT ${turnoverCr.toFixed(2)} কোটি) ১০ কোটি টাকার সীমা অতিক্রম করেছে। শর্তগুলো বিকল্প হওয়ায় মূলধন ৫ কোটি টাকার কম হলেও CA অডিট বাধ্যতামূলক।`
            : `Annual Turnover (BDT ${turnoverCr.toFixed(2)} crore) exceeds the BDT 10 crore threshold. Because the criteria are alternative, a CA audit is mandatory even though Capital is BDT 5 crore or less.`
          : isBn
          ? `মূলধন (BDT ${capitalCr.toFixed(2)} কোটি) ৫ কোটি টাকার সীমা অতিক্রম করেছে। শর্তগুলো বিকল্প হওয়ায় টার্নওভার ১০ কোটি টাকার কম হলেও CA অডিট বাধ্যতামূলক।`
          : `Capital (BDT ${capitalCr.toFixed(2)} crore) exceeds the BDT 5 crore threshold. Because the criteria are alternative, a CA audit is mandatory even though Annual Turnover is BDT 10 crore or less.`;

      return {
        status: 'audit_mandatory' as const,
        turnoverCr,
        capitalCr,
        triggerDetail,
      };
    }

    const reasonDetail = isExactBoundary
      ? isBn
        ? 'আইনের ভাষায় "১০ কোটি টাকার অধিক" এবং "৫ কোটি টাকার অধিক" বলা হয়েছে। ঠিক সীমায় পৌঁছালে শুধু এই শর্তে অডিট বাধ্যতামূলক হয় না, তবে ধারা ৭৩(২) অনুযায়ী প্রত্যয়িত ICS দাখিল করা বাধ্যতামূলক (দীর্ঘমেয়াদি চুক্তিসহ অন্যান্য স্বতন্ত্র শর্ত প্রযোজ্য না থাকলে)।'
        : 'The statutory rule is strictly "more than" BDT 10 crore in turnover or "more than" BDT 5 crore in capital. Reaching the exact limit does not independently trigger a CA audit, but a certified ICS remains mandatory under Section 73(2) (assuming no independent trigger such as long-term contracts).'
      : isBn
      ? `টার্নওভার (BDT ${turnoverCr.toFixed(2)} কোটি ≤ ১০ কোটি) এবং মূলধন (BDT ${capitalCr.toFixed(2)} কোটি ≤ ৫ কোটি)—কোনোটিই সীমা অতিক্রম করেনি। তাই ধারা ৭৩(১)-এর এই সীমায় CA অডিট বাধ্যতামূলক নয়; তবে ধারা ৭৩(২) অনুযায়ী CA, CMA বা আয়কর আইনজীবী কর্তৃক প্রত্যয়িত ICS দাখিল বাধ্যতামূলক।`
      : `Neither Annual Turnover (BDT ${turnoverCr.toFixed(2)} crore ≤ 10 crore) nor Capital (BDT ${capitalCr.toFixed(2)} crore ≤ 5 crore) exceeds the Section 73(1) threshold. A CA audit is not mandatory under these criteria, but a certified ICS (by a CA, CMA, or Income Tax Lawyer) is still mandatory under Section 73(2).`;

    return {
      status: 'ics_only' as const,
      turnoverCr,
      capitalCr,
      reasonDetail,
    };
  }, [turnoverInput, capitalInput, unit, isBn]);

  return (
    <div
      role="region"
      aria-labelledby="quick-s73-calc-title"
      className={`rounded-xl border border-slate-200 bg-white text-slate-900 ${className}`}
    >
      {/* Top Bar */}
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calculator className="h-3.5 w-3.5 shrink-0 text-slate-600" aria-hidden="true" />
            <span>{isBn ? 'ধারা ৭৩(১) ও ৭৩(২) তাৎক্ষণিক ক্যালকুলেটর' : 'Section 73(1) & 73(2) Quick Calculator'}</span>
          </div>
          <h4
            id="quick-s73-calc-title"
            className="mt-0.5 text-base font-semibold text-slate-900"
          >
            {isBn
              ? 'CA অডিট বাধ্যতামূলক নাকি শুধুমাত্র ICS প্রয়োজন?'
              : 'CA Audit Mandatory or ICS Only?'}
          </h4>
        </div>

        {/* Unit Selector */}
        <div className="inline-flex shrink-0 items-center gap-1 self-start rounded-lg bg-slate-100 p-1 sm:self-auto">
          <button
            type="button"
            onClick={() => handleUnitChange('crore')}
            className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
              unit === 'crore'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isBn ? 'কোটি টাকা' : 'BDT Crore'}
          </button>
          <button
            type="button"
            onClick={() => handleUnitChange('bdt')}
            className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
              unit === 'bdt'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isBn ? 'টাকা (BDT)' : 'Exact BDT'}
          </button>
        </div>
      </div>

      {/* Inputs & Presets */}
      <div className="space-y-4 px-5 py-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="quick-calc-turnover"
              className="block text-xs font-semibold text-slate-700"
            >
              {isBn ? 'বার্ষিক টার্নওভার (Annual Turnover)' : 'Annual Turnover'}
            </label>
            <div className="mt-1.5 flex items-center rounded-lg border border-slate-300 bg-white focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
              <span className="pl-3 text-xs font-medium text-slate-500 select-none">BDT</span>
              <input
                id="quick-calc-turnover"
                type="number"
                min="0"
                step={unit === 'crore' ? '0.5' : '1000000'}
                value={turnoverInput}
                onChange={(e) => setTurnoverInput(e.target.value)}
                placeholder={unit === 'crore' ? 'e.g. 12' : 'e.g. 120000000'}
                className="w-full bg-transparent px-2.5 py-2 font-mono text-sm tabular-nums text-slate-900 focus:outline-none"
              />
              {unit === 'crore' && (
                <span className="pr-3 text-xs font-medium text-slate-500 select-none">
                  {isBn ? 'কোটি' : 'Crore'}
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] font-mono tabular-nums text-slate-500">
              {isBn ? 'অডিট সীমা: > ১০ কোটি টাকা' : 'Audit threshold: > BDT 10 crore'}
            </p>
          </div>

          <div>
            <label
              htmlFor="quick-calc-capital"
              className="block text-xs font-semibold text-slate-700"
            >
              {isBn ? 'মূলধন (Capital)' : 'Capital'}
            </label>
            <div className="mt-1.5 flex items-center rounded-lg border border-slate-300 bg-white focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
              <span className="pl-3 text-xs font-medium text-slate-500 select-none">BDT</span>
              <input
                id="quick-calc-capital"
                type="number"
                min="0"
                step={unit === 'crore' ? '0.5' : '1000000'}
                value={capitalInput}
                onChange={(e) => setCapitalInput(e.target.value)}
                placeholder={unit === 'crore' ? 'e.g. 2' : 'e.g. 20000000'}
                className="w-full bg-transparent px-2.5 py-2 font-mono text-sm tabular-nums text-slate-900 focus:outline-none"
              />
              {unit === 'crore' && (
                <span className="pr-3 text-xs font-medium text-slate-500 select-none">
                  {isBn ? 'কোটি' : 'Crore'}
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] font-mono tabular-nums text-slate-500">
              {isBn ? 'অডিট সীমা: > ৫ কোটি টাকা' : 'Audit threshold: > BDT 5 crore'}
            </p>
          </div>
        </div>

        {/* Preset Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {SECTION_1_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.turnoverCr, preset.capitalCr)}
                className="whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                {isBn ? preset.bn : preset.en}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            {isBn ? 'মুছুন' : 'Clear'}
          </button>
        </div>

        {/* Instant Verdict */}
        <div className="border-t border-slate-200 pt-4" aria-live="polite">
          {evaluation.status === 'empty' && (
            <p className="text-xs text-slate-500">
              {isBn
                ? 'ফলাফল দেখতে উপরে বার্ষিক টার্নওভার এবং মূলধন লিখুন।'
                : 'Enter Annual Turnover and Capital above to immediately check whether a CA audit is mandatory or only an ICS is required.'}
            </p>
          )}

          {evaluation.status === 'audit_mandatory' && (
            <div className="rounded-lg bg-amber-50/70 px-4 py-3.5 text-slate-900">
              <div className="flex items-start gap-2.5">
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-amber-950">
                    {isBn
                      ? 'ফলাফল: CA অডিট বাধ্যতামূলক (DVS/DVC এবং প্রত্যয়িত ICS-সহ)'
                      : 'Result: CA Audit Is Mandatory (Plus DVS/DVC & Certified ICS)'}
                  </p>
                  <p className="text-xs leading-relaxed text-amber-900/90">
                    {evaluation.triggerDetail}
                  </p>
                </div>
              </div>
            </div>
          )}

          {evaluation.status === 'ics_only' && (
            <div className="rounded-lg bg-emerald-50/70 px-4 py-3.5 text-slate-900">
              <div className="flex items-start gap-2.5">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-emerald-950">
                    {isBn
                      ? 'ফলাফল: শুধুমাত্র প্রত্যয়িত ICS প্রয়োজন (এই সীমায় CA অডিট বাধ্যতামূলক নয়)'
                      : 'Result: Only Certified ICS Required (CA Audit Not Mandatory Under Thresholds)'}
                  </p>
                  <p className="text-xs leading-relaxed text-emerald-900/90">
                    {evaluation.reasonDetail}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
