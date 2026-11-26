import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  Calculator,
  CheckCircle2,
  FileCheck2,
  RotateCcw,
} from 'lucide-react';

export interface AuditEligibilityCalculatorProps {
  className?: string;
}

const TURNOVER_LIMIT_CRORE = 10;
const CAPITAL_LIMIT_CRORE = 5;

const QUICK_SCENARIOS = [
  { id: 'turnover-trigger', label: 'Turnover Trigger (12 Cr / 2 Cr)', turnoverCr: 12, capitalCr: 2 },
  { id: 'capital-trigger', label: 'Capital Trigger (8 Cr / 6 Cr)', turnoverCr: 8, capitalCr: 6 },
  { id: 'ics-only', label: 'ICS Only (7 Cr / 3 Cr)', turnoverCr: 7, capitalCr: 3 },
  { id: 'exact-limit', label: 'Exact Limit (10 Cr / 5 Cr)', turnoverCr: 10, capitalCr: 5 },
];

const formatCrore = (val: number): string =>
  `BDT ${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} crore`;

const formatTaka = (croreVal: number): string =>
  `BDT ${Math.round(croreVal * 10_000_000).toLocaleString('en-IN')}`;

export const AuditEligibilityCalculator: React.FC<AuditEligibilityCalculatorProps> = ({
  className = '',
}) => {
  const [unit, setUnit] = useState<'crore' | 'bdt'>('crore');
  const [annualTurnover, setAnnualTurnover] = useState<string>('12');
  const [capital, setCapital] = useState<string>('2');

  const handleUnitSwitch = (nextUnit: 'crore' | 'bdt') => {
    if (nextUnit === unit) return;
    const t = Number.parseFloat(annualTurnover);
    const c = Number.parseFloat(capital);

    if (nextUnit === 'bdt') {
      setAnnualTurnover(Number.isFinite(t) ? String(Math.round(t * 10_000_000)) : '');
      setCapital(Number.isFinite(c) ? String(Math.round(c * 10_000_000)) : '');
    } else {
      setAnnualTurnover(Number.isFinite(t) ? String(Number((t / 10_000_000).toFixed(2))) : '');
      setCapital(Number.isFinite(c) ? String(Number((c / 10_000_000).toFixed(2))) : '');
    }
    setUnit(nextUnit);
  };

  const applyScenario = (turnoverCr: number, capitalCr: number) => {
    if (unit === 'crore') {
      setAnnualTurnover(String(turnoverCr));
      setCapital(String(capitalCr));
    } else {
      setAnnualTurnover(String(turnoverCr * 10_000_000));
      setCapital(String(capitalCr * 10_000_000));
    }
  };

  const handleReset = () => {
    setAnnualTurnover('');
    setCapital('');
  };

  const result = useMemo(() => {
    const hasTurnover = annualTurnover.trim() !== '';
    const hasCapital = capital.trim() !== '';

    if (!hasTurnover && !hasCapital) {
      return { state: 'empty' as const };
    }

    const parsedTurnover = Math.max(0, Number.parseFloat(annualTurnover) || 0);
    const parsedCapital = Math.max(0, Number.parseFloat(capital) || 0);

    const turnoverCr = unit === 'crore' ? parsedTurnover : parsedTurnover / 10_000_000;
    const capitalCr = unit === 'crore' ? parsedCapital : parsedCapital / 10_000_000;

    const turnoverExceeds = turnoverCr > TURNOVER_LIMIT_CRORE;
    const capitalExceeds = capitalCr > CAPITAL_LIMIT_CRORE;
    const auditMandatory = turnoverExceeds || capitalExceeds;
    const isExactBoundary =
      !auditMandatory &&
      (turnoverCr === TURNOVER_LIMIT_CRORE || capitalCr === CAPITAL_LIMIT_CRORE);

    let explanation = '';
    if (turnoverExceeds && capitalExceeds) {
      explanation = `Both Annual Turnover (${formatCrore(turnoverCr)}) and Capital (${formatCrore(capitalCr)}) exceed the Section 73(1) thresholds (> BDT 10 crore turnover / > BDT 5 crore capital).`;
    } else if (turnoverExceeds) {
      explanation = `Annual Turnover (${formatCrore(turnoverCr)}) exceeds BDT 10 crore. Because the Section 73(1) conditions are alternative, a CA-audited financial statement is mandatory even though Capital is within BDT 5 crore.`;
    } else if (capitalExceeds) {
      explanation = `Capital (${formatCrore(capitalCr)}) exceeds BDT 5 crore. Because the Section 73(1) conditions are alternative, a CA-audited financial statement is mandatory even though Annual Turnover is within BDT 10 crore.`;
    } else if (isExactBoundary) {
      explanation =
        'Section 73(1) applies strictly to turnover "more than" BDT 10 crore or capital "more than" BDT 5 crore. Reaching the exact threshold alone does not trigger a mandatory CA audit, but a certified Income Computation Sheet (ICS) remains mandatory under Section 73(2).';
    } else {
      explanation = `Neither Annual Turnover (${formatCrore(turnoverCr)}) nor Capital (${formatCrore(capitalCr)}) exceeds the statutory thresholds. A CA audit is not mandatory under these financial thresholds alone, but a certified Income Computation Sheet (ICS) is required under Section 73(2).`;
    }

    return {
      state: auditMandatory ? ('audit_mandatory' as const) : ('ics_only' as const),
      turnoverCr,
      capitalCr,
      turnoverExceeds,
      capitalExceeds,
      auditMandatory,
      explanation,
    };
  }, [annualTurnover, capital, unit]);

  return (
    <section
      aria-labelledby="audit-eligibility-calculator-heading"
      className={`rounded-xl border border-slate-200 bg-white text-slate-900 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Income Tax Act, 2023 (Section 73) · Finance Act, 2026 · Tax Year 2026–2027
          </p>
          <h2
            id="audit-eligibility-calculator-heading"
            className="mt-1 flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-900"
          >
            <Calculator className="h-5 w-5 shrink-0 text-slate-700" aria-hidden="true" />
            <span>Audit Eligibility Calculator</span>
          </h2>
        </div>

        {/* Unit Switcher */}
        <div
          role="group"
          aria-label="Input currency unit"
          className="inline-flex shrink-0 items-center gap-1 self-start rounded-lg bg-slate-100 p-1 sm:self-auto"
        >
          <button
            type="button"
            onClick={() => handleUnitSwitch('crore')}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              unit === 'crore'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            BDT Crore
          </button>
          <button
            type="button"
            onClick={() => handleUnitSwitch('bdt')}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              unit === 'bdt'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Exact BDT
          </button>
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-6 px-6 py-6 sm:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="audit-calc-annual-turnover"
              className="block text-sm font-medium text-slate-800"
            >
              Annual Turnover
            </label>
            <div className="mt-1.5 flex items-center rounded-lg border border-slate-300 bg-white focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
              <span className="pl-3 text-xs font-medium text-slate-500 select-none">BDT</span>
              <input
                id="audit-calc-annual-turnover"
                type="number"
                min="0"
                step={unit === 'crore' ? '0.5' : '1000000'}
                value={annualTurnover}
                onChange={(e) => setAnnualTurnover(e.target.value)}
                placeholder={unit === 'crore' ? 'e.g. 12' : 'e.g. 120000000'}
                className="w-full bg-transparent px-2.5 py-2.5 font-mono text-sm tabular-nums text-slate-900 focus:outline-none"
              />
              {unit === 'crore' && (
                <span className="pr-3 text-xs font-medium text-slate-500 select-none">Crore</span>
              )}
            </div>
            <p className="mt-1.5 font-mono text-xs tabular-nums text-slate-500">
              Mandatory audit threshold: more than BDT 10 crore
            </p>
          </div>

          <div>
            <label
              htmlFor="audit-calc-capital"
              className="block text-sm font-medium text-slate-800"
            >
              Capital
            </label>
            <div className="mt-1.5 flex items-center rounded-lg border border-slate-300 bg-white focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
              <span className="pl-3 text-xs font-medium text-slate-500 select-none">BDT</span>
              <input
                id="audit-calc-capital"
                type="number"
                min="0"
                step={unit === 'crore' ? '0.5' : '1000000'}
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                placeholder={unit === 'crore' ? 'e.g. 2' : 'e.g. 20000000'}
                className="w-full bg-transparent px-2.5 py-2.5 font-mono text-sm tabular-nums text-slate-900 focus:outline-none"
              />
              {unit === 'crore' && (
                <span className="pr-3 text-xs font-medium text-slate-500 select-none">Crore</span>
              )}
            </div>
            <p className="mt-1.5 font-mono text-xs tabular-nums text-slate-500">
              Mandatory audit threshold: more than BDT 5 crore
            </p>
          </div>
        </div>

        {/* Preset Buttons & Clear */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Quick scenarios:</span>
            {QUICK_SCENARIOS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => applyScenario(item.turnoverCr, item.capitalCr)}
                className="whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Clear Inputs
          </button>
        </div>

        {/* Live Eligibility Result */}
        <div className="border-t border-slate-200 pt-5" aria-live="polite">
          {result.state === 'empty' ? (
            <p className="text-sm text-slate-500">
              Enter your firm&apos;s Annual Turnover and Capital above to immediately check whether
              a CA-audited financial statement is mandatory or only a certified Income Computation
              Sheet (ICS) is required.
            </p>
          ) : (
            <div className="space-y-5">
              {/* Verdict Banner */}
              <div
                className={`rounded-lg px-5 py-4 ${
                  result.auditMandatory ? 'bg-amber-50/80' : 'bg-emerald-50/80'
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.auditMandatory ? (
                    <AlertTriangle
                      className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
                      aria-hidden="true"
                    />
                  ) : (
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"
                      aria-hidden="true"
                    />
                  )}
                  <div className="space-y-1">
                    <h3
                      className={`text-base font-semibold ${
                        result.auditMandatory ? 'text-amber-950' : 'text-emerald-950'
                      }`}
                    >
                      {result.auditMandatory
                        ? 'CA-Audited Financial Statements Mandatory (Plus DVS/DVC & Certified ICS)'
                        : 'Only Income Computation Sheet (ICS) Required — CA Audit Not Mandatory Under Thresholds'}
                    </h3>
                    <p
                      className={`text-xs leading-relaxed ${
                        result.auditMandatory ? 'text-amber-900/90' : 'text-emerald-900/90'
                      }`}
                    >
                      {result.explanation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Threshold Breakdown Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                      <th className="py-2.5 pr-4">Statutory Check</th>
                      <th className="py-2.5 px-4">Entered / Basis</th>
                      <th className="py-2.5 pl-4">Requirement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        Annual Turnover Test
                        <span className="block text-xs font-normal text-slate-500">
                          Limit: &gt; BDT 10.00 crore
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs tabular-nums text-slate-700">
                        {formatCrore(result.turnoverCr)}
                        <span className="block text-[11px] text-slate-500">
                          {formatTaka(result.turnoverCr)}
                        </span>
                      </td>
                      <td className="py-3 pl-4 font-medium">
                        {result.turnoverExceeds ? (
                          <span className="text-amber-800">Exceeds Threshold (Audit Triggered)</span>
                        ) : (
                          <span className="text-emerald-800">Within Threshold</span>
                        )}
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        Capital Test
                        <span className="block text-xs font-normal text-slate-500">
                          Limit: &gt; BDT 5.00 crore
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs tabular-nums text-slate-700">
                        {formatCrore(result.capitalCr)}
                        <span className="block text-[11px] text-slate-500">
                          {formatTaka(result.capitalCr)}
                        </span>
                      </td>
                      <td className="py-3 pl-4 font-medium">
                        {result.capitalExceeds ? (
                          <span className="text-amber-800">Exceeds Threshold (Audit Triggered)</span>
                        ) : (
                          <span className="text-emerald-800">Within Threshold</span>
                        )}
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        CA-Audited Financial Statements &amp; DVC
                        <span className="block text-xs font-normal text-slate-500">
                          Section 73(1) · ICAB DVS Portal
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        Registered Chartered Accountant (CA)
                      </td>
                      <td className="py-3 pl-4 font-semibold">
                        {result.auditMandatory ? (
                          <span className="text-amber-800">Mandatory (with ICAB DVC)</span>
                        ) : (
                          <span className="text-slate-600">Not Mandatory Under Thresholds</span>
                        )}
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        Income Computation Sheet (ICS)
                        <span className="block text-xs font-normal text-slate-500">
                          Section 73(2) · All covered partnership firms
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        CA, CMA, or Income Tax Lawyer
                      </td>
                      <td className="py-3 pl-4 font-semibold text-slate-900">
                        <span className="inline-flex items-center gap-1.5">
                          <FileCheck2 className="h-4 w-4 text-slate-700" aria-hidden="true" />
                          Mandatory
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Footer Links & Caveat */}
              <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-relaxed text-slate-500 max-w-xl">
                  Note: Independent statutory audit triggers (such as income from long-term contracts
                  under Section 73(1)) may still require a CA audit regardless of turnover or
                  capital.
                </p>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Link
                    to="/article/partnership-firm-audit-requirements-bangladesh-2026-2027"
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50"
                  >
                    Read Full Section 73 Guide
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                  <Link
                    to="/tools/dvc-verification"
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800"
                  >
                    ICAB DVC Verification
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AuditEligibilityCalculator;
