import { useState, useEffect, useRef } from 'react';
import { CheckSquare, Square, FileText, CheckCircle2, AlertCircle, Camera, Loader2 } from 'lucide-react';
import { addClientActivity } from '../../services/clientActivityService';

export interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  category: 'mandatory' | 'conditional';
}

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'audited_financials',
    label: 'Audited Financial Statements',
    description: 'Must be audited and certified by a Chartered Accountant (CA).',
    category: 'mandatory'
  },
  {
    id: 'income_statement',
    label: 'Income Statement & Balance Sheet',
    description: 'Detailed breakdown of revenue, expenses, and financial position.',
    category: 'mandatory'
  },
  {
    id: 'computation_sheet',
    label: 'Income Computation Sheet',
    description: 'Certified by a CA, CMA, or ITP (Required for all companies, or turnover > 10cr, or capital > 5cr).',
    category: 'mandatory'
  },
  {
    id: 'tax_payment_proof',
    label: 'Proof of Tax Payment (Challan)',
    description: 'A-challan or electronic payment confirmation of full tax liability.',
    category: 'mandatory'
  },
  {
    id: 'bank_statements',
    label: 'Bank Statements',
    description: 'Corresponding to the income year.',
    category: 'mandatory'
  },
  {
    id: 'ifrs_compliance',
    label: 'IFRS Compliance Documentation',
    description: 'Required for specific businesses like real estate developers (IFRS 15).',
    category: 'conditional'
  }
];

export function ComplianceChecklist() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedText, setScannedText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadChecklist = () => {
      const saved = localStorage.getItem('corporateChecklist');
      if (saved) {
        try {
          setCheckedItems(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse checklist', e);
        }
      }
    };

    loadChecklist();
    window.addEventListener('storage', loadChecklist);
    window.addEventListener('corporate_checklist_updated', loadChecklist);
    return () => {
      window.removeEventListener('storage', loadChecklist);
      window.removeEventListener('corporate_checklist_updated', loadChecklist);
    };
  }, []);

  useEffect(() => {
    const total = CHECKLIST_ITEMS.length;
    const completed = Object.values(checkedItems).filter(Boolean).length;
    setProgress(Math.round((completed / total) * 100));
    
    if (Object.keys(checkedItems).length > 0) {
      localStorage.setItem('corporateChecklist', JSON.stringify(checkedItems));
    } else if (localStorage.getItem('corporateChecklist')) {
        localStorage.setItem('corporateChecklist', JSON.stringify({}));
    }
  }, [checkedItems]);

  const toggleItem = (id: string) => {
    setCheckedItems(prev => {
      const willBeChecked = !prev[id];
      if (willBeChecked) {
        const item = CHECKLIST_ITEMS.find(it => it.id === id);
        if (item) {
          addClientActivity({
            type: 'task_completion',
            title: `Completed ${item.label}`,
            description: item.description || `Verified compliance item: ${item.label}`,
            clientName: 'Active Client Account',
            clientCompany: 'Corporate Tax Compliance Docket',
            clientEmail: 'compliance@accounticca.com',
            status: 'completed',
            practiceArea: 'Corporate Tax & Compliance',
            referenceId: `TSK-${Date.now().toString().slice(-4)}`,
            sourceChannel: 'Compliance Checklist Task Flow',
            notes: 'Completed and verified via Dashboard Corporate Tax Checklist.'
          });
        }
      }
      return {
        ...prev,
        [id]: willBeChecked
      };
    });
  };

  const handleScanClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsScanning(true);
      setScannedText('');
      
      const formData = new FormData();
      formData.append('document', file);

      const response = await fetch('/api/scan-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to scan document');
      }

      const data = await response.json();
      setScannedText(data.text);
    } catch (error) {
      console.error('Scan error:', error);
      alert('Failed to scan the document. Please ensure the backend is running and the Gemini API key is set.');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const isAllMandatoryCompleted = CHECKLIST_ITEMS
    .filter(item => item.category === 'mandatory')
    .every(item => checkedItems[item.id]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 p-2.5 rounded-2xl text-emerald-700">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Tax Return Checklist</h2>
            <p className="text-slate-600 text-sm">Assessment Year 2026-27 Requirements</p>
          </div>
        </div>
        
        <button 
          onClick={handleScanClick}
          disabled={isScanning}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed shrink-0"
        >
          {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          <span>{isScanning ? 'Scanning...' : 'Scan Document'}</span>
        </button>
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          capture="environment"
          className="hidden"
        />
      </div>

      {scannedText && (
        <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              Scanned Document Content
            </h4>
            <button 
              onClick={() => setScannedText('')}
              className="text-slate-400 hover:text-slate-600"
            >
              &times;
            </button>
          </div>
          <div className="bg-white border border-slate-100 rounded-lg p-3 text-sm text-slate-700 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">
            {scannedText}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-slate-700">Preparation Progress</span>
          <span className="text-sm font-bold text-emerald-600">{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div 
            className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {isAllMandatoryCompleted && progress > 0 ? (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 items-start">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-emerald-900 text-sm">Ready for Filing</h4>
            <p className="text-emerald-700 text-xs mt-1">All mandatory documents are prepared. Ensure you file before the deadline to claim any eligible rebates.</p>
          </div>
        </div>
      ) : (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-900 text-sm">Action Required</h4>
            <p className="text-amber-700 text-xs mt-1">Please prepare all mandatory documents to avoid late filing penalties or rejection of the return.</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {CHECKLIST_ITEMS.map((item) => {
          const isChecked = checkedItems[item.id] || false;
          
          return (
            <div 
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                isChecked 
                  ? 'bg-emerald-50/50 border-emerald-200' 
                  : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-slate-50'
              }`}
            >
              <button 
                className={`shrink-0 mt-0.5 transition-colors ${isChecked ? 'text-emerald-600' : 'text-slate-400'}`}
              >
                {isChecked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`font-bold text-sm ${isChecked ? 'text-emerald-900 line-through opacity-70' : 'text-slate-900'}`}>
                    {item.label}
                  </h4>
                  {item.category === 'conditional' && (
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                      If Applicable
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className={`text-xs ${isChecked ? 'text-emerald-700/70' : 'text-slate-500'}`}>
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
