import { useState } from 'react';
import { ShieldCheck, CheckCircle2, Circle, AlertTriangle } from 'lucide-react';

const DEFENSE_CHECKLIST = [
  {
    id: 'income_source',
    title: 'Income Source Documentation',
    description: 'Bank statements, invoices, and pay slips verifying all declared income sources are properly filed.'
  },
  {
    id: 'investment_records',
    title: 'Investment & Asset Records',
    description: 'Documents proving legitimate sources of investments (FDR, savings certificates, stocks) and property deeds.'
  },
  {
    id: 'expense_vouchers',
    title: 'Expense Vouchers & Proof',
    description: 'Authentic receipts, bills, and payment proof for all claimed business and personal tax-deductible expenses.'
  },
  {
    id: 'liabilities',
    title: 'Formal Liability Agreements',
    description: 'Formal loan agreements, bank statements showing disbursement, or signed contracts for reported liabilities.'
  },
  {
    id: 'tax_return_copy',
    title: 'Verified Return Copy',
    description: 'A submitted and acknowledged copy of the current and past tax returns with wealth statements.'
  }
];

export function Section272Checklist() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setCompleted(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const completedCount = Object.values(completed).filter(Boolean).length;
  const progressPercentage = Math.round((completedCount / DEFENSE_CHECKLIST.length) * 100);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 my-10 shadow-sm font-sans">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-700">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Defense Documentation Checklist</h3>
          <p className="text-sm text-slate-500">Verify your compliance readiness against Section 272 allegations</p>
        </div>
      </div>

      <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div className="flex justify-between text-sm font-semibold mb-2">
          <span className="text-slate-900">Audit Readiness</span>
          <span className={progressPercentage === 100 ? 'text-emerald-600' : 'text-amber-600'}>
            {progressPercentage}%
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
          <div 
            className={`h-2.5 rounded-full transition-all duration-700 ease-in-out ${progressPercentage === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        {progressPercentage < 100 ? (
          <p className="text-xs text-amber-600 font-medium mt-3 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Incomplete documentation leaves you vulnerable to penalty assessments.
          </p>
        ) : (
          <p className="text-xs text-emerald-600 font-medium mt-3 flex items-center gap-1.5 animate-in fade-in zoom-in">
            <CheckCircle2 className="w-4 h-4" />
            Excellent! You have the necessary documentary evidence to defend your tax filings.
          </p>
        )}
      </div>

      <div className="space-y-3">
        {DEFENSE_CHECKLIST.map((item) => {
          const isChecked = !!completed[item.id];
          return (
            <label 
              key={item.id} 
              className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                isChecked ? 'bg-emerald-50/50 border-emerald-200 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="mt-0.5 relative flex-shrink-0">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={isChecked}
                  onChange={() => toggleItem(item.id)}
                />
                {isChecked ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 transition-transform scale-100" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-300 transition-transform hover:scale-110" />
                )}
              </div>
              <div className="flex-1">
                <h4 className={`font-semibold text-sm sm:text-base transition-colors ${isChecked ? 'text-emerald-900' : 'text-slate-900'}`}>
                  {item.title}
                </h4>
                <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${isChecked ? 'text-emerald-700/80' : 'text-slate-500'}`}>
                  {item.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
