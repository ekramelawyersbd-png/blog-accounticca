import React, { useState, useEffect } from 'react';
import { Check, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
}

interface ChecklistCategory {
  id: string;
  title: string;
  items: ChecklistItem[];
}

const defaultCategories: ChecklistCategory[] = [
  {
    id: 'income',
    title: 'Income Documents',
    items: [
      { id: 'salary', label: 'Salary certificates' },
      { id: 'business', label: 'Business income records' },
      { id: 'rental', label: 'Rental income details' },
      { id: 'investment_income', label: 'Investment income statements' },
    ]
  },
  {
    id: 'tax_payments',
    title: 'Tax Payment Records',
    items: [
      { id: 'tds', label: 'Tax deducted at source (TDS) certificates' },
      { id: 'ait', label: 'Advance income tax payment records' },
      { id: 'previous_tax', label: 'Previous tax documents' },
    ]
  },
  {
    id: 'investments',
    title: 'Investment Documents',
    items: [
      { id: 'dps', label: 'DPS statements' },
      { id: 'insurance', label: 'Insurance premium receipts' },
      { id: 'provident_fund', label: 'Provident fund records' },
      { id: 'approved_investments', label: 'Approved investment certificates' },
    ]
  }
];

export function DocumentChecklist() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    income: true,
    tax_payments: true,
    investments: true
  });

  useEffect(() => {
    const stored = localStorage.getItem('tax-document-checklist');
    if (stored) {
      try {
        setCheckedItems(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  const toggleItem = (id: string) => {
    const newChecked = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(newChecked);
    localStorage.setItem('tax-document-checklist', JSON.stringify(newChecked));
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const totalItems = defaultCategories.reduce((acc, cat) => acc + cat.items.length, 0);
  const completedItems = Object.values(checkedItems).filter(Boolean).length;
  const progress = Math.round((completedItems / totalItems) * 100) || 0;

  return (
    <div className="not-prose my-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-emerald-50 border-b border-emerald-100 p-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-6 h-6 text-emerald-600" />
          <h3 className="text-xl font-bold text-slate-900 m-0">Interactive Document Checklist</h3>
        </div>
        <p className="text-slate-600 text-sm mb-4">Track the documents you have prepared for your tax return filing.</p>
        
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2 bg-emerald-200/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm font-bold text-emerald-700">{progress}% Ready</span>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {defaultCategories.map(category => (
          <div key={category.id} className="p-0">
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <h4 className="font-bold text-slate-800 m-0 text-left">{category.title}</h4>
              {expandedCategories[category.id] ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
            
            {expandedCategories[category.id] && (
              <div className="px-4 pb-4">
                <ul className="list-none pl-0 space-y-2 m-0">
                  {category.items.map(item => (
                    <li key={item.id} className="p-0 m-0">
                      <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors m-0">
                        <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          checkedItems[item.id] 
                            ? 'bg-emerald-500 border-emerald-500' 
                            : 'bg-white border-slate-300 group-hover:border-emerald-400'
                        }`}>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={checkedItems[item.id] || false}
                            onChange={() => toggleItem(item.id)}
                          />
                          {checkedItems[item.id] && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className={`flex-1 text-base ${checkedItems[item.id] ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                          {item.label}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
