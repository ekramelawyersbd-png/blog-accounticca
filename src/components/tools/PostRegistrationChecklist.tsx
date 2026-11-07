import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  ShieldCheck, 
  UserCheck, 
  FileCheck, 
  Calendar, 
  Building2, 
  Download, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle,
  Clock,
  Briefcase,
  AlertCircle,
  Share2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { buildAppointmentUrl } from '../../utils/appointmentRedirect';

export interface ChecklistTask {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  deadline: string;
  authority: string;
  legalReference: string;
  description: string;
  requiredDocuments: string[];
  actionLabel?: string;
  actionUrl?: string;
}

const POST_REGISTRATION_TASKS: ChecklistTask[] = [
  // Category 1: RJSC Statutory Portal & Certified Copies
  {
    id: 'rjsc-entity-account',
    category: 'RJSC Statutory Access',
    title: 'Establish Entity User Account on RJSC Portal',
    subtitle: 'Link official company registration to the ROC App Portal',
    deadline: 'Within 7 days of incorporation',
    authority: 'RJSC (ROC App Portal)',
    legalReference: 'Companies Act 1994 & Statutory E-Filing Rules',
    description: 'Set up designated online entity login credentials associated with the newly incorporated entity to manage future statutory returns, Director updates (Form XII), and annual filings.',
    requiredDocuments: [
      'Incorporation Certificate Number',
      'Designated Director / Secretary NID',
      'Board Resolution authorizing Portal User',
      'Official Corporate Email Address'
    ],
    actionLabel: 'Visit RJSC Portal Login',
    actionUrl: 'https://app.roc.gov.bd/psp/login'
  },
  {
    id: 'rjsc-certified-copies',
    category: 'RJSC Statutory Access',
    title: 'Request Certified True Copies (CTC)',
    subtitle: 'Obtain official stamped copies of constitutional documents',
    deadline: 'Within 14 days of incorporation',
    authority: 'RJSC Registrar Office',
    legalReference: 'Companies Act 1994 Section 390',
    description: 'Apply for official government-certified copies of the Memorandum of Association (MoA), Articles of Association (AoA), Form XII (Director details), and Incorporation Certificate for bank opening and license applications.',
    requiredDocuments: [
      'Form 117 / Incorporation Reference Number',
      'Application Fee Receipt (৳500–৳1,500)',
      'Company Letterhead Request'
    ],
    actionLabel: 'Apply CTC Online',
    actionUrl: 'https://app.roc.gov.bd/psp/certified_copy'
  },

  // Category 2: Tax & Municipal Licensing
  {
    id: 'company-etin',
    category: 'Tax & Municipal Licenses',
    title: 'Obtain Corporate e-TIN Certificate',
    subtitle: '12-Digit Corporate Tax Identification Number from NBR',
    deadline: 'Within 15 days of incorporation',
    authority: 'National Board of Revenue (NBR)',
    legalReference: 'Income Tax Act 2023 Section 261',
    description: 'Register the company with the NBR e-TIN portal to obtain the 12-digit Taxpayer Identification Number required for opening corporate bank accounts and obtaining trade licenses.',
    requiredDocuments: [
      'RJSC Incorporation Certificate',
      'MoA and AoA Certified Copies',
      'Managing Director NID & Personal e-TIN'
    ],
    actionLabel: 'NBR e-TIN Registration',
    actionUrl: 'https://secure.incometax.gov.bd/TINHome'
  },
  {
    id: 'trade-license',
    category: 'Tax & Municipal Licenses',
    title: 'Secure City Corporation / Municipal Trade License',
    subtitle: 'Local commercial operating license',
    deadline: 'Prior to commercial operations',
    authority: 'City Corporation / Pourashava / Union Parishad',
    legalReference: 'Local Government (City Corporation) Act 2009',
    description: 'Obtain local trade license for the registered office address. Required annually for physical premises, banking operations, and commercial contracts.',
    requiredDocuments: [
      'RJSC Certificate of Incorporation & Form XII',
      'Company e-TIN Certificate',
      'Office Tenancy Agreement / Deed & Holding Tax Receipt',
      'Directors 2 Copies Photo & NID'
    ]
  },
  {
    id: 'vat-bin-registration',
    category: 'Tax & Municipal Licenses',
    title: 'Register NBR Value Added Tax (BIN) - Mushak 2.1',
    subtitle: 'Business Identification Number under VAT & SD Act 2012',
    deadline: 'Prior to issuing commercial invoices',
    authority: 'NBR Customs, Excise & VAT Commissionerate',
    legalReference: 'Value Added Tax and Supplementary Duty Act 2012',
    description: 'Obtain 9-digit Business Identification Number (BIN) via NBR online portal to legally charge VAT, claim input tax credits, and clear imported capital equipment.',
    requiredDocuments: [
      'Corporate e-TIN & Trade License',
      'Bank Account Clearance / Solvency Certificate',
      'Office Premises Rent Agreement & Layout Map',
      'Bank Statement showing Capital Injection'
    ],
    actionLabel: 'NBR VAT Online Portal',
    actionUrl: 'https://vat.gov.bd'
  },

  // Category 3: Banking & Financial Operations
  {
    id: 'corporate-bank-account',
    category: 'Banking & Financial Operations',
    title: 'Open Commercial Bank Corporate Account',
    subtitle: 'Activate company bank account & credit facility',
    deadline: 'Within 30 days of incorporation',
    authority: 'Scheduled Commercial Bank / Bangladesh Bank',
    legalReference: 'Bangladesh Bank BFIU Circulars & Money Laundering Prevention Act',
    description: 'Open official corporate account in company name. Pass CIB verification and deposit initial paid-up capital.',
    requiredDocuments: [
      'Board Resolution to open account & signatory power',
      'RJSC CTC of MoA, AoA, Form XII & Certificate',
      'Company e-TIN & Trade License',
      'Directors NID, e-TIN, Passport Photos & CIB Declaration'
    ]
  },

  // Category 4: Statutory Compliance Calendar Setup
  {
    id: 'compliance-calendar-setup',
    category: 'Statutory Compliance Calendar',
    title: 'Setup Annual Statutory Compliance Calendar',
    subtitle: 'Configure automated AGM, Schedule X, and tax deadlines',
    deadline: 'Immediate & Ongoing',
    authority: 'RJSC & NBR Internal Calendar',
    legalReference: 'Companies Act Section 81, 108 & Income Tax Act Section 166',
    description: 'Establish a firm compliance calendar for key statutory obligations: Annual General Meeting (AGM within 18 months of incorporation), Schedule X filing within 30 days of AGM, monthly Mushak 9.1 VAT returns (by 15th), and Corporate Tax Return.',
    requiredDocuments: [
      'Company Statutory Register',
      'Board Meeting Minutes Ledger',
      'Audited Financial Statements (for AGM)'
    ]
  }
];

export function PostRegistrationChecklist() {
  const [completedTasks, setCompletedTasks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('accounticca_post_reg_tasks');
      return saved ? JSON.parse(saved) : ['rjsc-entity-account'];
    } catch {
      return ['rjsc-entity-account'];
    }
  });

  const [expandedTask, setExpandedTask] = useState<string | null>('rjsc-certified-copies');

  useEffect(() => {
    try {
      localStorage.setItem('accounticca_post_reg_tasks', JSON.stringify(completedTasks));
    } catch (e) {
      console.error(e);
    }
  }, [completedTasks]);

  const toggleTask = (taskId: string) => {
    if (completedTasks.includes(taskId)) {
      setCompletedTasks(completedTasks.filter(id => id !== taskId));
    } else {
      setCompletedTasks([...completedTasks, taskId]);
    }
  };

  const progressPercentage = Math.round((completedTasks.length / POST_REGISTRATION_TASKS.length) * 100);

  // Group tasks by category
  const categories = Array.from(new Set(POST_REGISTRATION_TASKS.map(t => t.category)));

  return (
    <div id="post-registration-checklist" className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-600 text-white p-3.5 rounded-2xl shadow-md shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
                Post-Registration Mandatory Compliance Checklist
              </h2>
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Interactive Guide
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Step-by-step statutory roadmap for newly incorporated Bangladeshi Private & Public Limited companies.
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 min-w-[220px] shrink-0 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600 uppercase tracking-wider">Compliance Status</span>
            <span className="text-emerald-600 font-mono text-sm">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 text-right font-medium">
            {completedTasks.length} of {POST_REGISTRATION_TASKS.length} completed
          </p>
        </div>
      </div>

      {/* Task List by Category */}
      <div className="space-y-6">
        {categories.map((category) => {
          const categoryTasks = POST_REGISTRATION_TASKS.filter(t => t.category === category);
          const categoryCompleted = categoryTasks.every(t => completedTasks.includes(t.id));

          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  <span>{category}</span>
                </h3>
                {categoryCompleted && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Category Complete
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {categoryTasks.map((task) => {
                  const isDone = completedTasks.includes(task.id);
                  const isExpanded = expandedTask === task.id;

                  return (
                    <div 
                      key={task.id}
                      className={`border rounded-2xl transition-all ${
                        isDone 
                          ? 'bg-slate-50/60 border-slate-200' 
                          : 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
                      }`}
                    >
                      {/* Summary Header */}
                      <div className="p-4 sm:p-5 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5 flex-1">
                          <button
                            type="button"
                            onClick={() => toggleTask(task.id)}
                            className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                            title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-6 h-6 text-emerald-600 fill-emerald-100" />
                            ) : (
                              <Circle className="w-6 h-6 text-slate-300 hover:text-emerald-500" />
                            )}
                          </button>

                          <div className="space-y-1 cursor-pointer flex-1" onClick={() => setExpandedTask(isExpanded ? null : task.id)}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className={`text-sm sm:text-base font-extrabold ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                {task.title}
                              </h4>
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                                {task.authority}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">
                              {task.subtitle}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>{task.deadline}</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-slate-100 px-5 pb-5 pt-4 bg-slate-50/40 rounded-b-2xl space-y-4 text-xs"
                          >
                            <p className="text-slate-700 leading-relaxed text-xs">
                              {task.description}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200/80">
                              <div>
                                <span className="font-extrabold text-slate-900 uppercase tracking-wider block mb-1.5 flex items-center gap-1 text-[11px]">
                                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  Required Documents & Forms
                                </span>
                                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                                  {task.requiredDocuments.map((doc, idx) => (
                                    <li key={idx}>{doc}</li>
                                  ))}
                                </ul>
                              </div>

                              <div className="space-y-2">
                                <div>
                                  <span className="font-extrabold text-slate-900 uppercase tracking-wider block mb-0.5 text-[11px]">
                                    Statutory Authority & Act
                                  </span>
                                  <p className="text-slate-600 font-semibold">{task.authority} • {task.legalReference}</p>
                                </div>

                                <div>
                                  <span className="font-extrabold text-slate-900 uppercase tracking-wider block mb-0.5 text-[11px]">
                                    Mandatory Statutory Deadline
                                  </span>
                                  <p className="text-amber-800 font-bold bg-amber-50 inline-block px-2 py-0.5 rounded border border-amber-200">
                                    {task.deadline}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                              {task.actionUrl && (
                                <a
                                  href={task.actionUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-2xs"
                                >
                                  <span>{task.actionLabel || 'Access Portal'}</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}

                              <a
                                href={buildAppointmentUrl({
                                  service: 'Post-Registration Compliance Support',
                                  notes: `Task: ${task.title}, Authority: ${task.authority}`,
                                  source: 'PostRegistrationChecklist'
                                })}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-2xs ml-auto"
                              >
                                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Assign to Chamber Lawyers</span>
                              </a>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h4 className="text-sm font-extrabold text-emerald-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Full Turnkey Corporate Secretarial Retainer
          </h4>
          <p className="text-xs text-slate-300">
            Let ELA & Associates handle all your statutory RJSC filings, AGM minutes, NBR VAT returns, and corporate tax assessments.
          </p>
        </div>

        <a
          href={buildAppointmentUrl({
            service: 'Turnkey Corporate Secretarial Retainer',
            notes: 'Post-registration corporate retainer inquiry',
            source: 'PostRegistrationChecklist Banner'
          })}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs transition-all shrink-0 cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
          <span>Consult Corporate Barrister</span>
        </a>
      </div>
    </div>
  );
}

export default PostRegistrationChecklist;
