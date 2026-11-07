import { useState } from 'react';
import { FileSearch, Mail, Scale, CheckCircle2, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react';

export function PenaltyFlowchart() {
  const [currentStep, setCurrentStep] = useState(1);
  
  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };
  
  const reset = () => {
    setCurrentStep(1);
  };

  return (
    <div className="my-10 bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 font-sans shadow-sm overflow-hidden">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-slate-900 mb-3">
          Penalty Imposition Process (Section 272)
        </h3>
        <p className="text-slate-500 max-w-lg mx-auto">
          Step-by-step legal procedure followed by the Deputy Commissioner of Taxes (DCT) before imposing concealment penalties.
        </p>
      </div>

      <div className="flex flex-col items-center max-w-3xl mx-auto">
        
        {/* Step 1 */}
        <div className={`w-full max-w-md p-5 rounded-2xl border shadow-sm flex items-start gap-4 relative z-10 transition-all duration-500 ${currentStep >= 1 ? 'bg-slate-50 border-slate-200 opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none absolute'}`}>
          <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-200 text-slate-700">
            <FileSearch className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Step 1</span>
            <h4 className="font-bold text-slate-900 mb-1">Discrepancy Identified</h4>
            <p className="text-sm text-slate-600 leading-relaxed">Tax authority identifies suspected concealment in return, assets, or expenses.</p>
          </div>
        </div>

        {/* Vertical Line 1 */}
        <div className={`w-0.5 bg-slate-300 relative z-0 transition-all duration-700 ease-in-out ${currentStep >= 2 ? 'h-8 opacity-100' : 'h-0 opacity-0'}`}></div>

        {/* Step 2 */}
        <div className={`w-full max-w-md p-5 rounded-2xl border shadow-sm flex items-start gap-4 relative z-10 transition-all duration-500 ${currentStep >= 2 ? 'bg-amber-50 border-amber-200 opacity-100 translate-y-0' : 'opacity-0 translate-y-4 hidden'}`}>
          <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-amber-200 text-amber-600">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-1 block">Step 2</span>
            <h4 className="font-bold text-amber-900 mb-1">Formal Notice Issued</h4>
            <p className="text-sm text-amber-800 leading-relaxed">Taxpayer receives a mandatory legal notice under Section 272 explaining the allegations.</p>
          </div>
        </div>

        {/* Vertical Line 2 */}
        <div className={`w-0.5 bg-slate-300 relative z-0 transition-all duration-700 ease-in-out ${currentStep >= 3 ? 'h-8 opacity-100' : 'h-0 opacity-0'}`}></div>

        {/* Step 3 */}
        <div className={`w-full max-w-md p-5 rounded-2xl border shadow-sm flex items-start gap-4 relative z-10 transition-all duration-500 ${currentStep >= 3 ? 'bg-indigo-50 border-indigo-200 opacity-100 translate-y-0' : 'opacity-0 translate-y-4 hidden'}`}>
          <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-indigo-200 text-indigo-600">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1 block">Step 3</span>
            <h4 className="font-bold text-indigo-900 mb-1">Taxpayer Hearing</h4>
            <p className="text-sm text-indigo-800 leading-relaxed">Taxpayer exercises right to explain and submits concrete documentary evidence.</p>
          </div>
        </div>

        {/* Branching Structure */}
        <div className={`w-full relative mt-0 transition-all duration-700 ${currentStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 hidden'}`}>
          
          {/* Connector Trunk */}
          <div className="w-0.5 h-6 bg-slate-300 mx-auto"></div>
          
          {/* Desktop Branching lines */}
          <div className="hidden sm:flex justify-between w-[calc(50%+1.5rem)] mx-auto relative">
             {/* Horizontal Bar */}
             <div className="absolute top-0 left-0 w-full h-0.5 bg-slate-300"></div>
             {/* Left Drop */}
             <div className="w-0.5 h-6 bg-slate-300"></div>
             {/* Right Drop */}
             <div className="w-0.5 h-6 bg-slate-300"></div>
          </div>
          
          {/* Mobile vertical line fallback */}
          <div className="sm:hidden w-0.5 h-4 bg-slate-300 mx-auto"></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
            
            {/* Outcome A */}
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 shadow-sm text-center flex flex-col items-center hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4 border border-emerald-200 text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-2 block">Outcome A</span>
              <h4 className="font-bold text-emerald-900 mb-2 text-lg">No Concealment</h4>
              <p className="text-sm text-emerald-800 leading-relaxed">Evidence shows genuine error or misinterpretation. No penalty is imposed.</p>
            </div>
            
            {/* Outcome B */}
            <div className="bg-red-50 p-6 rounded-2xl border border-red-200 shadow-sm text-center flex flex-col items-center relative hover:shadow-md transition-shadow">
              {/* Mobile linking line between the two boxes */}
              <div className="w-0.5 h-6 bg-slate-300 absolute -top-6 sm:hidden z-0"></div>
              
              <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4 border border-red-200 text-red-600">
                <AlertCircle className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-700 mb-2 block">Outcome B</span>
              <h4 className="font-bold text-red-900 mb-2 text-lg">Intentional Concealment</h4>
              <p className="text-sm text-red-800 leading-relaxed">Concealment is proven. Penalty order is issued (taxpayer retains right to appeal).</p>
            </div>

          </div>
        </div>

      </div>
      
      {/* Interactive Controls */}
      <div className="mt-10 flex justify-center items-center gap-4">
        {currentStep < 4 ? (
          <button
            onClick={nextStep}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Reveal Next Step <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={reset}
            className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Restart Process
          </button>
        )}
      </div>
    </div>
  );
}
