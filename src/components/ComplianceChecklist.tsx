import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Bell, Calendar, X, CalendarPlus, ExternalLink } from 'lucide-react';
import { LegalTooltip } from './LegalTooltip';

const REQUIREMENTS = [
  {
    id: 'schedule-x',
    title: 'Schedule X',
    description: 'A statutory return containing updated company information, including shareholding and director details.',
    tooltip: 'An annual summary of share capital, shareholders, and directors required by the Registrar of Joint Stock Companies (RJSC).'
  },
  {
    id: 'audited-financials',
    title: 'Audited Financial Statements',
    description: 'Financial statements prepared and audited according to applicable accounting and auditing requirements.',
  },
  {
    id: 'form-23b',
    title: 'Form 23B',
    description: 'A notice submitted by the appointed auditor regarding acceptance of the audit assignment.',
    tooltip: 'The official statutory notice filed by a newly appointed auditor confirming their acceptance to audit the company.'
  },
  {
    id: 'icab-dvc',
    title: 'ICAB Document Verification Code (DVC)',
    description: 'Audit reports submitted through RJSC must include the required Document Verification Code (DVC) issued by ICAB.',
    tooltip: 'A unique code issued by the Institute of Chartered Accountants of Bangladesh (ICAB) to authenticate audit reports.'
  }
];

const addDays = (dateStr: string, days: number) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d;
};

const formatDate = (d: Date) => {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const generateGoogleCalendarLink = (title: string, baseDateStr: string, daysToAdd: number, description: string) => {
  const d = addDays(baseDateStr, daysToAdd);
  
  // Format as all-day event: YYYYMMDD
  const start = d.toISOString().split('T')[0].replace(/-/g, '');
  
  const nextDay = new Date(d);
  nextDay.setDate(nextDay.getDate() + 1);
  const end = nextDay.toISOString().split('T')[0].replace(/-/g, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description,
    dates: `${start}/${end}`
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const generateSpecificDateCalendarLink = (title: string, dateStr: string, description: string) => {
  const d = new Date(dateStr);
  const start = d.toISOString().split('T')[0].replace(/-/g, '');
  const nextDay = new Date(d);
  nextDay.setDate(nextDay.getDate() + 1);
  const end = nextDay.toISOString().split('T')[0].replace(/-/g, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description,
    dates: `${start}/${end}`
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export function ComplianceChecklist() {
  const [completed, setCompleted] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('compliance-checklist-progress');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse checklist state', e);
        }
      }
    }
    return {};
  });

  const [showReminder, setShowReminder] = useState(false);
  const [agmDate, setAgmDate] = useState<string>('');
  
  const [activeModalItem, setActiveModalItem] = useState<string | null>(null);
  const [modalDate, setModalDate] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('compliance-checklist-progress', JSON.stringify(completed));
  }, [completed]);

  const toggleItem = (id: string) => {
    setCompleted(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const completedCount = Object.values(completed).filter(Boolean).length;
  const progressPercentage = Math.round((completedCount / REQUIREMENTS.length) * 100);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 my-10 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Required Documents Checklist</h3>
          <p className="text-sm text-slate-600">
            Track your progress gathering the essential documents for RJSC Annual Return Filing. Your progress is saved automatically to your device.
          </p>
        </div>
        <button 
          onClick={() => setShowReminder(!showReminder)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0 border ${
            showReminder 
              ? 'bg-indigo-100 border-indigo-200 text-indigo-800' 
              : 'bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          Set Reminders
        </button>
      </div>

      {showReminder && (
        <div className="mb-6 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5">
          <div className="flex justify-between items-start mb-4">
            <h4 className="font-semibold text-indigo-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Filing Deadline Calculator
            </h4>
            <button onClick={() => setShowReminder(false)} className="text-indigo-400 hover:text-indigo-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-indigo-900 mb-1.5">
                When was your <LegalTooltip term="Annual General Meeting (AGM)" definition="A mandatory yearly gathering of a company's interested shareholders where the directors present an annual report containing information for shareholders about the company's performance and strategy.">Annual General Meeting (AGM)</LegalTooltip>?
              </label>
              <input 
                type="date" 
                value={agmDate}
                onChange={(e) => setAgmDate(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700"
              />
            </div>

            {agmDate && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Schedule X Reminder */}
                <a 
                  href={generateGoogleCalendarLink("RJSC Schedule X Filing Deadline", agmDate, 21, "Deadline to file Schedule X with RJSC (21 days after AGM).")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white border border-indigo-100 p-3 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all group"
                >
                  <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <CalendarPlus className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-slate-500 mb-0.5">Schedule X (21 Days)</div>
                    <div className="text-sm font-bold text-indigo-900">
                      {formatDate(addDays(agmDate, 21))}
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" />
                </a>

                {/* Financials Reminder */}
                <a 
                  href={generateGoogleCalendarLink("RJSC Financial Statements Deadline", agmDate, 30, "Deadline to file Audited Financial Statements with RJSC (30 days after AGM).")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white border border-indigo-100 p-3 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all group"
                >
                  <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <CalendarPlus className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-slate-500 mb-0.5">Financials (30 Days)</div>
                    <div className="text-sm font-bold text-indigo-900">
                      {formatDate(addDays(agmDate, 30))}
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div className="flex justify-between text-sm font-semibold mb-2">
          <span className="text-slate-900">Preparation Progress</span>
          <span className="text-emerald-600">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden relative">
          <div 
            className="bg-emerald-500 h-2.5 rounded-full transition-all duration-700 ease-in-out relative"
            style={{ width: `${progressPercentage}%` }}
          >
            {progressPercentage === 100 && (
              <div className="absolute inset-0 bg-white/40 animate-pulse rounded-full" />
            )}
          </div>
        </div>
        <div 
          className={`transition-all duration-500 overflow-hidden ${
            progressPercentage === 100 ? 'opacity-100 max-h-20 mt-3' : 'opacity-0 max-h-0 mt-0'
          }`}
        >
          <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            All required documents prepared. Ready for submission.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {REQUIREMENTS.map((req) => {
          const isChecked = !!completed[req.id];
          return (
            <label 
              key={req.id} 
              className={`flex items-start gap-4 p-4 md:p-5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                isChecked ? 'bg-emerald-50/50 border-emerald-200 shadow-sm' : 'bg-white border-slate-200 hover:border-emerald-200 hover:shadow-sm'
              }`}
            >
              <div className="mt-0.5 relative flex-shrink-0">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={isChecked}
                  onChange={() => toggleItem(req.id)}
                />
                {isChecked ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 transition-transform scale-100" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-300 transition-transform hover:scale-110" />
                )}
              </div>
              
              <div className="flex-1">
                <h4 className={`font-semibold text-base transition-colors ${isChecked ? 'text-emerald-900' : 'text-slate-900'}`}>
                  {req.tooltip ? (
                    <LegalTooltip term={req.title} definition={req.tooltip}>{req.title}</LegalTooltip>
                  ) : (
                    req.title
                  )}
                </h4>
                <p className={`text-sm mt-1 leading-relaxed ${isChecked ? 'text-emerald-700/80' : 'text-slate-500'}`}>
                  {req.description}
                </p>
              </div>

              <div className="flex-shrink-0 mt-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveModalItem(req.id);
                    setModalDate(''); // Reset date
                  }}
                  className={`p-2 rounded-xl transition-colors border ${
                    isChecked 
                      ? 'bg-emerald-100/50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200'
                  }`}
                  title="Set individual reminder"
                >
                  <Bell className="w-4 h-4" />
                </button>
              </div>
            </label>
          );
        })}
      </div>

      {/* Item Reminder Modal */}
      {activeModalItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-slate-900">Set Deadline Reminder</h3>
              <button 
                onClick={() => setActiveModalItem(null)}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full p-1.5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm text-slate-600 mb-5">
              Select the final submission date for <strong className="text-slate-900">{REQUIREMENTS.find(r => r.id === activeModalItem)?.title}</strong>.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Target Deadline
              </label>
              <input 
                type="date" 
                value={modalDate}
                onChange={(e) => setModalDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-colors"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setActiveModalItem(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              {modalDate ? (
                <a 
                  href={generateSpecificDateCalendarLink(
                    `RJSC Deadline: ${REQUIREMENTS.find(r => r.id === activeModalItem)?.title}`,
                    modalDate,
                    `Reminder to complete and file: ${REQUIREMENTS.find(r => r.id === activeModalItem)?.description}`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setActiveModalItem(null)}
                  className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm flex items-center gap-2"
                >
                  <CalendarPlus className="w-4 h-4" />
                  Save to Calendar
                </a>
              ) : (
                <button 
                  disabled
                  className="px-4 py-2 text-sm font-bold text-white bg-indigo-300 rounded-xl cursor-not-allowed flex items-center gap-2"
                >
                  <CalendarPlus className="w-4 h-4" />
                  Save to Calendar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
