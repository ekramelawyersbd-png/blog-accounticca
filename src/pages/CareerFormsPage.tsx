import React, { useState } from 'react';
import { Briefcase, Building2, Send, CheckCircle2, FileText, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { submitCareerApplicationToApi } from '../utils/careerStorage';

export function CareerFormsPage() {
  const [activeRole, setActiveRole] = useState<'accountant' | 'customercare'>('accountant');

  // Accountant Form State
  const [accSubmitted, setAccSubmitted] = useState(false);
  const [accSubmitting, setAccSubmitting] = useState(false);
  const [accName, setAccName] = useState('');
  const [accEmail, setAccEmail] = useState('');
  const [accPhone, setAccPhone] = useState('');
  const [accAddress, setAccAddress] = useState('');
  const [accLinkedin, setAccLinkedin] = useState('');
  const [accCvLink, setAccCvLink] = useState('');
  const [accDegree, setAccDegree] = useState('B.Com');
  const [accUniversity, setAccUniversity] = useState('');
  const [accMajor, setAccMajor] = useState('');
  const [accGradYear, setAccGradYear] = useState('');
  const [accResult, setAccResult] = useState('');
  const [accBookkeeping, setAccBookkeeping] = useState('Yes');
  const [accLedger, setAccLedger] = useState('Yes');
  const [accApAr, setAccApAr] = useState('Yes');
  const [accBankRec, setAccBankRec] = useState('Yes');
  const [accTaxVat, setAccTaxVat] = useState('Yes');
  const [accSoftware, setAccSoftware] = useState<string[]>(['QuickBooks']);
  const [accExcel, setAccExcel] = useState('Intermediate');
  const [accHasExp, setAccHasExp] = useState('Yes');
  const [accTotalExp, setAccTotalExp] = useState('1–2 Years');
  const [accExpDesc, setAccExpDesc] = useState('');
  const [accFullTime, setAccFullTime] = useState('Yes');
  const [accSalary, setAccSalary] = useState('');
  const [accJoinAvailability, setAccJoinAvailability] = useState('');
  const [accSuitability, setAccSuitability] = useState('');
  const [accDeclaration, setAccDeclaration] = useState(false);

  // Customer Care Form State
  const [ccSubmitted, setCcSubmitted] = useState(false);
  const [ccSubmitting, setCcSubmitting] = useState(false);
  const [ccName, setCcName] = useState('');
  const [ccPhone, setCcPhone] = useState('');
  const [ccEmail, setCcEmail] = useState('');
  const [ccAddress, setCcAddress] = useState('');
  const [ccAge, setCcAge] = useState('');
  const [ccDegree, setCcDegree] = useState('HSC');
  const [ccInstitution, setCcInstitution] = useState('');
  const [ccDeptGroup, setCcDeptGroup] = useState('');
  const [ccPassingYear, setCcPassingYear] = useState('');
  const [ccBangla, setCcBangla] = useState('Excellent');
  const [ccEnglish, setCcEnglish] = useState('Good');
  const [ccCustomerHandling, setCcCustomerHandling] = useState('Excellent');
  const [ccActiveListening, setCcActiveListening] = useState('Excellent');
  const [ccPhoneComfort, setCcPhoneComfort] = useState('Yes');
  const [ccComputerSkill, setCcComputerSkill] = useState('Good');
  const [ccHasExp, setCcHasExp] = useState('No');
  const [ccPrevCompany, setCcPrevCompany] = useState('');
  const [ccTotalExp, setCcTotalExp] = useState('No Experience');
  const [ccComplaintComfort, setCcComplaintComfort] = useState('Yes');
  const [ccTeamwork, setCcTeamwork] = useState('Yes');
  const [ccAngryHandling, setCcAngryHandling] = useState('');
  const [ccSuitability, setCcSuitability] = useState('');
  const [ccSalary, setCcSalary] = useState('');
  const [ccJoinTime, setCcJoinTime] = useState('Immediately');
  const [ccDeclaration, setCcDeclaration] = useState(false);

  const [accRefId, setAccRefId] = useState('');
  const [ccRefId, setCcRefId] = useState('');

  const handleAccountantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccSubmitting(true);
    const now = new Date();
    const refId = `ELAW-ACC-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      const receipt = await submitCareerApplicationToApi({
        applicationRefId: refId,
        position: 'Accountant',
        department: 'Accounts Division',
        fullName: accName.trim() || 'Applicant',
        email: accEmail.trim() || 'candidate@example.com',
        phone: accPhone.trim() || '01700000000',
        address: accAddress.trim() || 'Dhaka',
        location: 'Dhaka',
        linkedin: accLinkedin.trim(),
        highestQualification: accDegree,
        degreeProgram: accDegree,
        major: accMajor.trim() || 'Accounting',
        institution: accUniversity.trim() || 'University',
        graduationYear: accGradYear.trim() || String(now.getFullYear()),
        academicResult: accResult.trim() || 'Passed',
        currentlyStudying: 'No',
        accountingPrinciplesRating: '4 - Advanced',
        accountingActivities: ['Bookkeeping and transaction entry'],
        accountingSoftware: accSoftware,
        excelSkill: accExcel,
        taxVat: accTaxVat,
        workExperience: accHasExp,
        experienceLength: accTotalExp,
        responsibilities: accExpDesc.trim(),
        training: 'Yes',
        fullTime: accFullTime,
        joinTime: accJoinAvailability.trim() || 'Immediately',
        officeLocation: 'Yes',
        salary: accSalary.trim() || 'Negotiable',
        cvFileName: accCvLink.trim() || 'Accountant_CV.pdf',
        cvFileSize: 350000,
        motivation: accSuitability.trim() || 'Interested in joining E-Lawyers as an Accountant.',
        submissionDate: now.toLocaleString()
      });
      setAccRefId(receipt.referenceId);
      setAccSubmitted(true);
    } finally {
      setAccSubmitting(false);
    }
  };

  const handleCustomerCareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCcSubmitting(true);
    const now = new Date();
    const refId = `ELAW-CCE-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      const receipt = await submitCareerApplicationToApi({
        applicationRefId: refId,
        position: 'Customer Care Executive (Female)',
        department: 'Customer Care / Call Center',
        fullName: ccName.trim() || 'Applicant',
        email: ccEmail.trim() || 'candidate@example.com',
        phone: ccPhone.trim() || '01700000000',
        address: ccAddress.trim() || 'Dhaka',
        location: 'Dhaka',
        highestQualification: ccDegree,
        degreeProgram: ccDeptGroup.trim() || ccDegree,
        major: ccDeptGroup.trim() || 'General',
        institution: ccInstitution.trim() || 'College / University',
        graduationYear: ccPassingYear.trim() || String(now.getFullYear()),
        academicResult: 'Passed',
        currentlyStudying: 'No',
        englishFluency: ccEnglish,
        bengaliFluency: ccBangla,
        workExperience: ccHasExp,
        experienceLength: ccTotalExp,
        training: 'Yes',
        fullTime: 'Yes',
        joinTime: ccJoinTime,
        officeLocation: 'Yes',
        salary: ccSalary.trim() || 'Negotiable',
        cvFileName: 'Customer_Care_CV.pdf',
        cvFileSize: 350000,
        motivation: ccAngryHandling.trim() || ccSuitability.trim() || 'Interested in joining E-Lawyers as Customer Care Executive.',
        submissionDate: now.toLocaleString()
      });
      setCcRefId(receipt.referenceId);
      setCcSubmitted(true);
    } finally {
      setCcSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-24">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-600/25 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-4">
          <Link
            to="/community/career"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-emerald-300 text-xs font-bold transition-all mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Career Hub</span>
          </Link>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dual Position Application Portal</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            E-Lawyers Professional Application Desk
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Select your desired role below between the <strong className="text-white">Accountant</strong> and <strong className="text-white">Customer Care Executive (Female)</strong> positions and complete the application form.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="app-form-60 w-full lg:w-[60vw] mx-auto px-4 sm:px-6 lg:px-0 -mt-8 relative z-20 space-y-8">
        
        {/* Role Switcher Tabs */}
        <div className="bg-white rounded-3xl p-3 border border-slate-200/90 shadow-lg grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setActiveRole('accountant')}
            className={`p-4 rounded-2xl flex items-center gap-4 transition-all text-left cursor-pointer ${
              activeRole === 'accountant'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/60'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
              activeRole === 'accountant' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              📊
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Accounts Division</div>
              <div className="text-sm sm:text-base font-extrabold">Accountant</div>
              <div className="text-xs opacity-90">2 Vacancies • Full-Time</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveRole('customercare')}
            className={`p-4 rounded-2xl flex items-center gap-4 transition-all text-left cursor-pointer ${
              activeRole === 'customercare'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/60'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
              activeRole === 'customercare' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              👩‍💼
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Customer Care Team</div>
              <div className="text-sm sm:text-base font-extrabold">Customer Care Executive (Female)</div>
              <div className="text-xs opacity-90">2 Vacancies • Full-Time</div>
            </div>
          </button>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl">
          
          {activeRole === 'accountant' ? (
            <div className="space-y-8">
              <div className="border-b border-slate-100 pb-5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg">
                    Accounts Division
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">Full-Time • 2 Openings</span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Accountant Job Application Form</h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Please complete all required fields carefully. Shortlisted or eligible candidates will proceed to the Computer-Based Test (CBT).
                </p>
              </div>

              {accSubmitted ? (
                <div className="py-12 px-6 text-center space-y-6 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-slate-50 rounded-3xl border border-emerald-200 shadow-xs">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto text-2xl shadow-md">
                    🎉
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-extrabold text-slate-900">Application Submitted Successfully!</h3>
                    <p className="text-xs sm:text-sm text-slate-700 max-w-md mx-auto leading-relaxed">
                      Thank you for applying to E-Lawyers Legal &amp; Business Consultancy Firm for the <strong className="text-slate-900">Accountant</strong> position.
                      {accRefId && (
                        <span className="block mt-2 font-mono font-bold text-emerald-700">
                          Reference ID: {accRefId}
                        </span>
                      )}
                    </p>
                    <div className="bg-white p-5 rounded-2xl border border-emerald-100 text-xs text-slate-600 space-y-2 text-left max-w-lg mx-auto">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Next Steps &amp; Computer-Based Test (CBT):</span>
                      </div>
                      <p>1. Our recruitment team will review your academic qualifications and accounting skills within 3–5 working days.</p>
                      <p>2. Shortlisted candidates will receive an email invitation for the Online Computer-Based Test (CBT).</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setAccSubmitted(false); }}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Submit Another Response
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAccountantSubmit} noValidate className="space-y-8">
                  {/* Section 1 */}
                  <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Section 1: Personal Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={accName}
                          onChange={(e) => setAccName(e.target.value)}
                          placeholder="Md. Rahim Uddin"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                          <input
                            type="email"
                            required
                            value={accEmail}
                            onChange={(e) => setAccEmail(e.target.value)}
                            placeholder="rahim@example.com"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Contact Number *</label>
                          <input
                            type="text"
                            required
                            value={accPhone}
                            onChange={(e) => setAccPhone(e.target.value)}
                            placeholder="+880 1700 000000"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Present Address *</label>
                        <input
                          type="text"
                          required
                          value={accAddress}
                          onChange={(e) => setAccAddress(e.target.value)}
                          placeholder="House 42, Road 11, Banani, Dhaka"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">LinkedIn Profile (Optional)</label>
                          <input
                            type="url"
                            value={accLinkedin}
                            onChange={(e) => setAccLinkedin(e.target.value)}
                            placeholder="https://linkedin.com/in/username"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">CV/Resume Link (Google Drive / PDF) *</label>
                          <input
                            type="text"
                            required
                            value={accCvLink}
                            onChange={(e) => setAccCvLink(e.target.value)}
                            placeholder="Drive link or file name"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Section 2: Educational Qualification</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Highest Educational Qualification *</label>
                          <select value={accDegree} onChange={(e) => setAccDegree(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white">
                            <option value="B.Com">B.Com</option>
                            <option value="BBA (Accounting/Finance)">BBA (Accounting/Finance)</option>
                            <option value="M.Com">M.Com</option>
                            <option value="MBA (Accounting/Finance)">MBA (Accounting/Finance)</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Name of University/Institution *</label>
                          <input
                            type="text"
                            required
                            value={accUniversity}
                            onChange={(e) => setAccUniversity(e.target.value)}
                            placeholder="University of Dhaka"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Major/Department *</label>
                          <input
                            type="text"
                            required
                            value={accMajor}
                            onChange={(e) => setAccMajor(e.target.value)}
                            placeholder="Accounting"
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Graduation Year *</label>
                          <input
                            type="text"
                            required
                            value={accGradYear}
                            onChange={(e) => setAccGradYear(e.target.value)}
                            placeholder="2025"
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">CGPA/Result *</label>
                          <input
                            type="text"
                            required
                            value={accResult}
                            onChange={(e) => setAccResult(e.target.value)}
                            placeholder="3.65 / 4.00"
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3 */}
                  <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Section 3: Accounting Skills</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Practical knowledge of bookkeeping? *</label>
                        <select value={accBookkeeping} onChange={(e) => setAccBookkeeping(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white">
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">General Ledger &amp; Financial Statements? *</label>
                        <select value={accLedger} onChange={(e) => setAccLedger(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white">
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Accounts Payable &amp; Receivable? *</label>
                        <select value={accApAr} onChange={(e) => setAccApAr(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white">
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Bank Reconciliation? *</label>
                        <select value={accBankRec} onChange={(e) => setAccBankRec(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white">
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Tax and VAT knowledge? *</label>
                        <select value={accTaxVat} onChange={(e) => setAccTaxVat(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white">
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Microsoft Excel skills *</label>
                        <select value={accExcel} onChange={(e) => setAccExcel(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white">
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 4 */}
                  <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Section 4: Work Experience</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Previous accounting experience? *</label>
                        <select value={accHasExp} onChange={(e) => setAccHasExp(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white">
                          <option value="Yes">Yes</option>
                          <option value="No — Fresh Graduate">No — Fresh Graduate</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Total Relevant Work Experience *</label>
                        <select value={accTotalExp} onChange={(e) => setAccTotalExp(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white">
                          <option value="No Experience">No Experience</option>
                          <option value="Less than 1 Year">Less than 1 Year</option>
                          <option value="1–2 Years">1–2 Years</option>
                          <option value="3+ Years">3+ Years</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Briefly describe your accounting experience (if applicable)</label>
                      <textarea
                        rows={2}
                        value={accExpDesc}
                        onChange={(e) => setAccExpDesc(e.target.value)}
                        placeholder="Mention past firms, responsibilities..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white resize-none"
                      />
                    </div>
                  </div>

                  {/* Section 5 */}
                  <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Section 5: Availability &amp; Declaration</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Full-time employment? *</label>
                        <select value={accFullTime} onChange={(e) => setAccFullTime(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white">
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Expected monthly salary? *</label>
                        <input
                          type="text"
                          required
                          value={accSalary}
                          onChange={(e) => setAccSalary(e.target.value)}
                          placeholder="BDT 30,000"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">When can you join? *</label>
                        <input
                          type="text"
                          required
                          value={accJoinAvailability}
                          onChange={(e) => setAccJoinAvailability(e.target.value)}
                          placeholder="Immediately"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Why do you think you are suitable for this Accountant position? *</label>
                      <textarea
                        rows={3}
                        required
                        value={accSuitability}
                        onChange={(e) => setAccSuitability(e.target.value)}
                        placeholder="Explain your motivation..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white resize-none"
                      />
                    </div>
                    <div className="pt-2">
                      <label className="flex items-start gap-2.5 cursor-pointer bg-white p-3.5 rounded-xl border border-slate-200">
                        <input
                          type="checkbox"
                          required
                          checked={accDeclaration}
                          onChange={(e) => setAccDeclaration(e.target.checked)}
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs text-slate-700 font-medium">
                          I confirm that the information provided is true and accurate. *
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={accSubmitting}
                      className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      <span>{accSubmitting ? 'Submitting Application...' : 'Submit Accountant Application'}</span>
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              <div className="border-b border-slate-100 pb-5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg">
                    Customer Care Team
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">Full-Time • 2 Openings (Female)</span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer Care Executive (Female) Job Application Form</h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Please complete all required fields accurately. Candidates who meet the requirements may be invited to the next stage of the recruitment process.
                </p>
              </div>

              {ccSubmitted ? (
                <div className="py-12 px-6 text-center space-y-6 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-slate-50 rounded-3xl border border-emerald-200 shadow-xs">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto text-2xl shadow-md">
                    🎉
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-extrabold text-slate-900">Application Submitted Successfully!</h3>
                    <p className="text-xs sm:text-sm text-slate-700 max-w-md mx-auto leading-relaxed">
                      Thank you for applying for the position of <strong className="text-slate-900">Customer Care Executive (Female)</strong>.
                      {ccRefId && (
                        <span className="block mt-2 font-mono font-bold text-emerald-700">
                          Reference ID: {ccRefId}
                        </span>
                      )}
                    </p>
                    <div className="bg-white p-5 rounded-2xl border border-emerald-100 text-xs text-slate-600 space-y-2 text-left max-w-lg mx-auto">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Next Steps &amp; Recruitment Review:</span>
                      </div>
                      <p>If your qualifications and communication skills match our requirements, our recruitment team will contact you regarding the next stage.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setCcSubmitted(false); }}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Submit Another Response
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCustomerCareSubmit} noValidate className="space-y-8">
                  {/* Section 1 */}
                  <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Section 1: Personal Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          inputMode="text"
                          autoComplete="name"
                          required
                          value={ccName}
                          onChange={(e) => setCcName(e.target.value)}
                          placeholder="Saima Akhter"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Contact Number *</label>
                          <input
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            required
                            value={ccPhone}
                            onChange={(e) => setCcPhone(e.target.value)}
                            placeholder="+880 1800 000000"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                          <input
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            required
                            value={ccEmail}
                            onChange={(e) => setCcEmail(e.target.value)}
                            placeholder="saima@example.com"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Present Address *</label>
                        <input
                          type="text"
                          inputMode="text"
                          autoComplete="street-address"
                          required
                          value={ccAddress}
                          onChange={(e) => setCcAddress(e.target.value)}
                          placeholder="Mirpur-10, Dhaka"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Age *</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            required
                            value={ccAge}
                            onChange={(e) => setCcAge(e.target.value)}
                            placeholder="23"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Applying for Female Customer Care Executive? *</label>
                          <select className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white">
                            <option value="Yes">Yes</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Section 2: Educational Qualification</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Highest Educational Qualification *</label>
                        <select value={ccDegree} onChange={(e) => setCcDegree(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white">
                          <option value="HSC">HSC</option>
                          <option value="Bachelor’s Degree">Bachelor’s Degree</option>
                          <option value="Master’s Degree">Master’s Degree</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Name of Institution *</label>
                        <input
                          type="text"
                          inputMode="text"
                          required
                          value={ccInstitution}
                          onChange={(e) => setCcInstitution(e.target.value)}
                          placeholder="Tejgaon College"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Department / Group *</label>
                        <input
                          type="text"
                          inputMode="text"
                          required
                          value={ccDeptGroup}
                          onChange={(e) => setCcDeptGroup(e.target.value)}
                          placeholder="Humanities / Business Studies"
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Passing Year *</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          required
                          value={ccPassingYear}
                          onChange={(e) => setCcPassingYear(e.target.value)}
                          placeholder="2024"
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3 */}
                  <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Section 3: Communication &amp; Skills</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Bangla communication skills? *</label>
                        <select value={ccBangla} onChange={(e) => setCcBangla(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white">
                          <option value="Excellent">Excellent</option>
                          <option value="Good">Good</option>
                          <option value="Average">Average</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">English communication skills? *</label>
                        <select value={ccEnglish} onChange={(e) => setCcEnglish(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white">
                          <option value="Excellent">Excellent</option>
                          <option value="Good">Good</option>
                          <option value="Average">Average</option>
                          <option value="Basic">Basic</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Customer handling skills? *</label>
                        <select value={ccCustomerHandling} onChange={(e) => setCcCustomerHandling(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white">
                          <option value="Excellent">Excellent</option>
                          <option value="Good">Good</option>
                          <option value="Average">Average</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Active listening skills? *</label>
                        <select value={ccActiveListening} onChange={(e) => setCcActiveListening(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white">
                          <option value="Excellent">Excellent</option>
                          <option value="Good">Good</option>
                          <option value="Average">Average</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 4 */}
                  <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Section 4: Work Experience</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Call Center / Customer Care experience? *</label>
                        <select value={ccHasExp} onChange={(e) => setCcHasExp(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white">
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Total Relevant Work Experience *</label>
                        <select value={ccTotalExp} onChange={(e) => setCcTotalExp(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white">
                          <option value="No Experience">No Experience</option>
                          <option value="Less than 1 year">Less than 1 year</option>
                          <option value="1–2 years">1–2 years</option>
                          <option value="More than 2 years">More than 2 years</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 5 */}
                  <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Section 5: Personal Attributes &amp; Availability</h3>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">How would you handle an angry customer? *</label>
                      <textarea
                        rows={2}
                        required
                        value={ccAngryHandling}
                        onChange={(e) => setCcAngryHandling(e.target.value)}
                        placeholder="Listen patiently, show empathy, and offer prompt resolution..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Expected monthly salary? *</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={ccSalary}
                          onChange={(e) => setCcSalary(e.target.value)}
                          placeholder="BDT 22,000"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">How soon can you join? *</label>
                        <select value={ccJoinTime} onChange={(e) => setCcJoinTime(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white">
                          <option value="Immediately">Immediately</option>
                          <option value="Within 7 days">Within 7 days</option>
                          <option value="Within 15 days">Within 15 days</option>
                          <option value="Within 1 month">Within 1 month</option>
                        </select>
                      </div>
                    </div>
                    <div className="pt-2">
                      <label className="flex items-start gap-2.5 cursor-pointer bg-white p-3.5 rounded-xl border border-slate-200">
                        <input
                          type="checkbox"
                          required
                          checked={ccDeclaration}
                          onChange={(e) => setCcDeclaration(e.target.checked)}
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs text-slate-700 font-medium">
                          I confirm that all information provided in this application is true and accurate. *
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={ccSubmitting}
                      className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      <span>{ccSubmitting ? 'Submitting Application...' : 'Submit Customer Care Application'}</span>
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
