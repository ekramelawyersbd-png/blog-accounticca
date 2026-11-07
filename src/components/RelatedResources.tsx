import React from 'react';
import { Link } from 'react-router-dom';
import { Calculator, FileText, ArrowRight, BookOpen, Briefcase } from 'lucide-react';

interface Resource {
  title: string;
  description: string;
  path: string;
  icon: React.ElementType;
}

const allResources: Resource[] = [
  {
    title: 'Income Tax Calculator',
    description: 'Calculate your personal income tax liability instantly based on the latest FY 2025-26 rules.',
    path: '/tax-calculator',
    icon: Calculator
  },
  {
    title: 'TDS Reference Guide',
    description: 'Find applicable Tax Deducted at Source (TDS) rates for various sectors.',
    path: '/tds-guide',
    icon: FileText
  },
  {
    title: 'Corporate Tax Planner',
    description: 'Optimize corporate tax calculations and view applicable rates for companies.',
    path: '/corporate-planner',
    icon: Briefcase
  },
  {
    title: 'Online Tax Refund Guide',
    description: 'Step-by-step guidance on how to process your tax refunds online.',
    path: '/tax-refund-guide',
    icon: BookOpen
  }
];

export function RelatedResources({ currentCategory }: { currentCategory?: string }) {
  // We can filter dynamically based on category or article topic, but for now we'll show the top 2-3 tools.
  const displayedResources = currentCategory === 'Corporate Law' 
    ? allResources.filter(r => ['/corporate-planner', '/tds-guide'].includes(r.path))
    : allResources.slice(0, 3); // Default resources

  return (
    <div className="bg-emerald-50 rounded-3xl p-8 mb-12 border border-emerald-100">
      <h3 className="text-xl font-bold text-slate-900 mb-6">Related Tools & Resources</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {displayedResources.map((resource, idx) => (
          <Link 
            key={idx} 
            to={resource.path}
            className="group flex flex-col justify-between bg-white p-5 rounded-2xl border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all duration-300"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                <resource.icon className="w-5 h-5 text-emerald-700" />
              </div>
              <h4 className="font-bold text-slate-900 mb-2">{resource.title}</h4>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">{resource.description}</p>
            </div>
            <div className="flex items-center text-sm font-bold text-emerald-600 group-hover:text-emerald-700">
              <span>Open Tool</span>
              <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
