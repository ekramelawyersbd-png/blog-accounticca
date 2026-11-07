import { useState } from 'react';
import { X, Award, ShieldCheck, CheckCircle2, Upload, Briefcase } from 'lucide-react';

interface ExpertApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExpertApplicationModal({ isOpen, onClose }: ExpertApplicationModalProps) {
  const [fullName, setFullName] = useState('');
  const [profession, setProfession] = useState('Lawyer / Advocate');
  const [credentials, setCredentials] = useState('');
  const [barNumber, setBarNumber] = useState('');
  const [experience, setExperience] = useState('5-10 Years');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Create Expert Contributor Profile</h3>
              <p className="text-xs text-slate-500">Apply for a verified practitioner badge on Accounticca</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-2">Application Received!</h4>
            <p className="text-sm text-slate-600 max-w-xs mb-3">
              Our editorial and verification committee will review your credentials and issue your verified practitioner badge within 24 hours.
            </p>
            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" /> High Credibility Network
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Barrister Nazmul Karim"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Primary Profession *
                </label>
                <select
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                >
                  <option value="Lawyer / Advocate">Lawyer / Advocate</option>
                  <option value="Chartered Accountant (CA/FCA)">Chartered Accountant (CA/FCA)</option>
                  <option value="VAT Specialist / Consultant">VAT Specialist / Consultant</option>
                  <option value="Income Tax Practitioner (ITP)">Income Tax Practitioner (ITP)</option>
                  <option value="Company Secretary (FCS)">Company Secretary (FCS)</option>
                  <option value="Corporate Financial Advisor">Corporate Financial Advisor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Experience Level
                </label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                >
                  <option value="3-5 Years">3-5 Years</option>
                  <option value="5-10 Years">5-10 Years</option>
                  <option value="10-15 Years">10-15 Years</option>
                  <option value="15+ Years">15+ Years</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Bar / ICAB / ICMAB / NBR Membership ID *
              </label>
              <input
                type="text"
                required
                value={barNumber}
                onChange={(e) => setBarNumber(e.target.value)}
                placeholder="e.g. SCBA Reg #4521 / ICAB Member #1294"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Educational Qualifications & Specialization
              </label>
              <textarea
                rows={2}
                value={credentials}
                onChange={(e) => setCredentials(e.target.value)}
                placeholder="e.g. LL.M in Commercial Law, Supreme Court Advocate; focus on FDI and M&A"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                Verified Badge on Approval
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                >
                  Submit Application
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
