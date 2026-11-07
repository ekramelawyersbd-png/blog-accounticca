import { useState } from 'react';
import { UserCircle } from 'lucide-react';

const pathways = [
  {
    role: "Accountant",
    description: "Build a strong foundation in financial record-keeping, payroll, and compliance.",
    steps: [
      {
        title: "MS Office Training",
        description: "Master Excel for data entry and financial modeling.",
        isCore: true
      },
      {
        title: "Practical Accounting",
        description: "Learn hands-on bookkeeping and financial statement preparation.",
        isCore: true
      },
      {
        title: "VAT Training",
        description: "Understand basic tax compliance and reporting.",
        isCore: false
      }
    ]
  },
  {
    role: "Tax Consultant",
    description: "Specialize in tax law, advisory, and corporate compliance for businesses and individuals.",
    steps: [
      {
        title: "Income Tax Training",
        description: "Deep dive into individual and corporate tax regulations.",
        isCore: true
      },
      {
        title: "VAT Training",
        description: "Master Value Added Tax and customs duty complexities.",
        isCore: true
      },
      {
        title: "RJSC Training",
        description: "Handle corporate structuring and licensing.",
        isCore: false
      }
    ]
  },
  {
    role: "Auditor",
    description: "Develop the analytical skills needed to verify financial records and ensure statutory compliance.",
    steps: [
      {
        title: "Practical Accounting",
        description: "Ensure a solid grasp of underlying accounting principles.",
        isCore: true
      },
      {
        title: "Income Tax Training",
        description: "Evaluate tax provisions and liabilities accurately.",
        isCore: true
      },
      {
        title: "VAT Training",
        description: "Audit indirect tax compliance and reporting.",
        isCore: false
      }
    ]
  }
];

export function CareerPathways() {
  const [activeRole, setActiveRole] = useState(pathways[0].role);

  const activePathway = pathways.find(p => p.role === activeRole) || pathways[0];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-10">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Career Pathways</h2>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto">
          Not sure where to start? Follow our guided training timelines tailored to your professional goals.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {pathways.map((pathway) => (
          <button
            key={pathway.role}
            onClick={() => setActiveRole(pathway.role)}
            className={`px-6 py-3 rounded-full font-medium transition-all flex items-center gap-2 ${
              activeRole === pathway.role
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <UserCircle className="w-5 h-5" />
            {pathway.role}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-slate-900 mb-2">The {activePathway.role} Track</h3>
          <p className="text-slate-500">{activePathway.description}</p>
        </div>

        <div className="relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {activePathway.steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-lg mb-4 border-4 border-white shadow-sm">
                  {index + 1}
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm w-full h-full relative group hover:border-emerald-200 transition-colors">
                  {step.isCore && (
                    <span className="absolute -top-3 right-4 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-2 rounded-full">
                      Core
                    </span>
                  )}
                  <h4 className="font-bold text-slate-900 mb-2 mt-2">{step.title}</h4>
                  <p className="text-slate-500 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
