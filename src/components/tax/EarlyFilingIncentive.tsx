import React, { useState, useEffect } from 'react';
import { CalendarCheck, Info, ArrowRight, ShieldCheck, Banknote, Sparkles, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EarlyFilingIncentiveProps {
  initialPayableTax?: number;
  className?: string;
}

export function EarlyFilingIncentive({ initialPayableTax = 0, className = '' }: EarlyFilingIncentiveProps) {
  const [payableTax, setPayableTax] = useState<number>(initialPayableTax);

  // Sync state if prop updates
  useEffect(() => {
    if (initialPayableTax > 0) {
      setPayableTax(initialPayableTax);
    }
  }, [initialPayableTax]);

  // Max rebate is 25,000 BDT
  const calculateIncentive = (tax: number) => {
    return Math.min(Math.round(tax * 0.05), 25000);
  };

  const incentiveAmount = calculateIncentive(payableTax);
  const netTaxAfterIncentive = Math.max(0, payableTax - incentiveAmount);

  return (
    <div className={`bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Early Filing Reward</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            5% Tax <span className="text-amber-600">Incentive Calculator</span>
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            File your income tax return early between <strong className="text-slate-800">July 1 and September 30</strong> to receive a 5% tax rebate on your net payable tax, up to BDT 25,000.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/tools"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-xs"
            title="Browse tax guides and professional tools"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Tax Tools</span>
          </Link>
          <Link
            to="/article/benefits-of-filing-income-tax-return-bangladesh"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors shrink-0"
            title="Read about income tax return benefits"
          >
            <span>Filing Benefits</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Left Side: Input & Info */}
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="incentive-tax-input" className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Net Payable Tax</span>
              </label>
            </div>
            <div className="relative mt-2">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-sm">
                Tk
              </span>
              <input
                id="incentive-tax-input"
                type="number"
                min="0"
                value={payableTax || ''}
                onChange={(e) => setPayableTax(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="Enter net payable tax"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2 flex items-start gap-1">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Calculated on the net tax liability before any wealth surcharge. Maximum rebate capped at BDT 25,000.</span>
            </p>
          </div>

          <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100 flex gap-3 items-start">
            <div className="bg-amber-100 p-2 rounded-lg shrink-0">
              <CalendarCheck className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">Eligibility Window</h4>
              <p className="text-xs text-amber-800/80 mt-1">
                You must submit your return and pay the net tax within the first quarter of the assessment year (July 1 to September 30).
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Calculation Results */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden h-full flex flex-col justify-center">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <Banknote className="w-36 h-36 text-white" />
          </div>

          <div className="relative z-10 space-y-5">
            <div className="border-b border-slate-700 pb-4">
              <div className="text-xs text-slate-400 font-semibold mb-1">Potential 5% Early Filing Incentive</div>
              <div className="text-4xl font-black text-amber-400">
                Tk {incentiveAmount.toLocaleString()}
              </div>
              {incentiveAmount >= 25000 && (
                <div className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-1 rounded inline-block mt-2 font-bold">
                  Maximum Limit Reached
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] text-slate-400 font-semibold mb-1">Original Payable Tax</div>
                <div className="text-base font-bold text-slate-200">
                  Tk {payableTax.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-emerald-400 font-bold tracking-wide uppercase mb-1">Final Tax After Reward</div>
                <div className="text-xl font-black text-white">
                  Tk {netTaxAfterIncentive.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
