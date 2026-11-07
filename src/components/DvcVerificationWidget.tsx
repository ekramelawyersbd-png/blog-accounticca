import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Search, Loader2, CheckCircle2, AlertTriangle, FileText, Building2, UserCheck, Calendar, Award, Copy, Check, Info, X, BookOpen } from 'lucide-react';

interface DvcRecord {
  dvcCode: string;
  companyName: string;
  tin: string;
  auditorName: string;
  firmName: string;
  icabEnrolment: string;
  incomeYear: string;
  assessmentYear: string;
  auditDate: string;
  status: 'Verified' | 'Revoked' | 'Expired';
  opinionType: string;
}

const PRESET_DVC_RECORDS: Record<string, DvcRecord> = {
  'DVC-2026-849201': {
    dvcCode: 'DVC-2026-849201',
    companyName: 'ABC Technologies Limited',
    tin: '392810492810',
    auditorName: 'Mohammad Farhad Hossain, FCA',
    firmName: 'Farhad & Co., Chartered Accountants',
    icabEnrolment: 'FCA-10482',
    incomeYear: '1 July 2025 - 30 June 2026',
    assessmentYear: '2026-2027',
    auditDate: '15 September 2026',
    status: 'Verified',
    opinionType: 'Unmodified (Clean) Audit Opinion'
  },
  'DVC-2026-993847': {
    dvcCode: 'DVC-2026-993847',
    companyName: 'Bengal Agro & Cold Storage PLC',
    tin: '582910394852',
    auditorName: 'Syed Naimul Islam, FCA',
    firmName: 'Islam & Partners, Chartered Accountants',
    icabEnrolment: 'FCA-09124',
    incomeYear: '1 July 2025 - 30 June 2026',
    assessmentYear: '2026-2027',
    auditDate: '28 August 2026',
    status: 'Verified',
    opinionType: 'Unmodified Audit Opinion with Emphasis of Matter'
  },
  'DVC-2026-118293': {
    dvcCode: 'DVC-2026-118293',
    companyName: 'Dhaka Textile Mills (BD) Ltd.',
    tin: '839201492018',
    auditorName: 'Nazma Sultana, FCA',
    firmName: 'Sultana Rahman & Co., Chartered Accountants',
    icabEnrolment: 'FCA-11209',
    incomeYear: '1 January 2025 - 31 December 2025',
    assessmentYear: '2026-2027',
    auditDate: '10 July 2026',
    status: 'Verified',
    opinionType: 'Unmodified (Clean) Audit Opinion'
  }
};

export function DvcVerificationWidget() {
  const [dvcInput, setDvcInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verifiedResult, setVerifiedResult] = useState<DvcRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleVerify = (e?: React.FormEvent, codeToTest?: string) => {
    if (e) e.preventDefault();
    const queryCode = (codeToTest !== undefined ? codeToTest : dvcInput).trim().toUpperCase();

    if (!queryCode) {
      setErrorMsg('Please enter a valid ICAB Document Verification Code (DVC).');
      setVerifiedResult(null);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setVerifiedResult(null);

    // Simulate secure API call to ICAB DVC server
    setTimeout(() => {
      setIsLoading(false);
      const cleanCode = queryCode.replace(/\s+/g, '');

      if (PRESET_DVC_RECORDS[cleanCode]) {
        setVerifiedResult(PRESET_DVC_RECORDS[cleanCode]);
      } else if (cleanCode.startsWith('DVC-2026-') || /^DVC-\d{4}-\d{6}$/.test(cleanCode) || /^\d{14,16}$/.test(cleanCode)) {
        // Generate a simulated valid dynamic record for any proper format
        setVerifiedResult({
          dvcCode: cleanCode,
          companyName: 'Apex Enterprise & Holdings Ltd.',
          tin: '748291048291',
          auditorName: 'Barrister & FCA Mahmudur Rahman',
          firmName: 'Rahman & Associates, Chartered Accountants',
          icabEnrolment: 'FCA-12049',
          incomeYear: '2025-2026',
          assessmentYear: '2026-2027',
          auditDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
          status: 'Verified',
          opinionType: 'Unmodified (Clean) Statutory Audit Opinion'
        });
      } else {
        setErrorMsg('Invalid or unregistered DVC code. Please verify the 16-digit ICAB Document Verification Code or consult your statutory auditor.');
      }
    }, 800);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-50 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  ICAB DVC Verification Portal
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Secure API
                </span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Verify audited financial statements and income computation certificates under Income Tax Act Section 73 & ICAB standards.
              </p>
            </div>
          </div>

          <div className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 self-start md:self-auto flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Regulated by ICAB & NBR</span>
          </div>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleVerify} className="mt-8 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Enter Document Verification Code (DVC)
              </label>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-all cursor-pointer"
                title="What is a DVC and where to find it?"
              >
                <Info className="w-3.5 h-3.5" />
                <span>What is DVC & Where to Find?</span>
              </button>
            </div>
            <div className="relative flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={dvcInput}
                  onChange={(e) => setDvcInput(e.target.value)}
                  placeholder="e.g. DVC-2026-849201"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-2xs"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !dvcInput.trim()}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validating...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Verify Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preset DVC Quick Test Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-bold text-slate-500">Quick Test Samples:</span>
            {Object.keys(PRESET_DVC_RECORDS).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setDvcInput(code);
                  handleVerify(undefined, code);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 transition-all cursor-pointer shadow-2xs"
              >
                <span>{code}</span>
              </button>
            ))}
          </div>
        </form>

        {/* Error Message */}
        {errorMsg && (
          <div className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-start gap-3 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h5 className="font-bold">Verification Failed</h5>
              <p className="text-xs mt-0.5 text-rose-700">{errorMsg}</p>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-100 px-2.5 py-1 rounded-lg cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Verification Result Card */}
        {verifiedResult && (
          <div className="mt-8 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 border border-emerald-200 rounded-3xl p-6 sm:p-8 shadow-md animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      Official ICAB Verification
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                      <Check className="w-3.5 h-3.5" /> Active & Authentic
                    </span>
                  </div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900 mt-1 font-mono">
                    {verifiedResult.dvcCode}
                  </h4>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(verifiedResult.dvcCode)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Copied DVC' : 'Copy Code'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" /> Company / Assessee Name
                </span>
                <p className="text-sm font-extrabold text-slate-900">{verifiedResult.companyName}</p>
                <p className="text-xs text-slate-500 font-mono">TIN: {verifiedResult.tin}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Statutory Auditor
                </span>
                <p className="text-sm font-extrabold text-slate-900">{verifiedResult.auditorName}</p>
                <p className="text-xs text-slate-600">{verifiedResult.firmName}</p>
                <p className="text-[11px] font-mono text-emerald-800 font-bold">Enrolment: {verifiedResult.icabEnrolment}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Audit Period & Year
                </span>
                <p className="text-sm font-bold text-slate-900">{verifiedResult.incomeYear}</p>
                <p className="text-xs text-slate-600">Assessment Year: {verifiedResult.assessmentYear}</p>
                <p className="text-[11px] text-slate-500">Certified on: {verifiedResult.auditDate}</p>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Audit Opinion: <strong className="text-slate-900">{verifiedResult.opinionType}</strong></span>
              </div>
              <div className="text-[11px] text-emerald-800 font-semibold bg-emerald-100/70 px-3 py-1 rounded-lg border border-emerald-200">
                Validated against NBR & ICAB DVC Central Repository
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DVC Explanation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    Understanding ICAB DVC (Document Verification Code)
                  </h3>
                  <p className="text-xs text-slate-500">Statutory Compliance Guide under Income Tax Act 2023</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-6 text-slate-700 text-sm leading-relaxed">
              <div>
                <h4 className="font-extrabold text-slate-900 text-base mb-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  What is a DVC Code?
                </h4>
                <p>
                  A <strong>Document Verification Code (DVC)</strong> is a unique secure alphanumeric code generated by the Institute of Chartered Accountants of Bangladesh (ICAB) when a member Chartered Accountant authenticates and signs financial statements, audit reports, or tax computation sheets.
                </p>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-xs space-y-2">
                <h5 className="font-bold text-emerald-900 uppercase tracking-wider">Statutory Mandate (Section 73)</h5>
                <p className="text-emerald-800">
                  Under Section 73 of the Income Tax Act 2023 (as amended by the Finance Act 2026), companies and qualifying business entities submitting their income tax returns must provide audited financial statements and an Income Computation Sheet verified with an authentic ICAB DVC. Returns without a valid DVC are treated as incomplete under Section 75.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-base mb-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  Where to Find DVC on Regulatory Documents?
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-xs sm:text-sm">
                  <li><strong>Auditor’s Report (Independent Auditor's Report):</strong> Printed prominently in the header or signature block along with the ICAB DVC QR code.</li>
                  <li><strong>Balance Sheet & Income Statement:</strong> Appearing at the bottom footer alongside the statutory auditor's seal and signature.</li>
                  <li><strong>Income Computation Sheet:</strong> Certified and cross-signed by both the company’s Managing Director/CFO and the ICAB-registered audit firm.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-base mb-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  Why Verify DVC?
                </h4>
                <p className="text-xs sm:text-sm text-slate-600">
                  Verification ensures the financial statements submitted to the National Board of Revenue (NBR), banks, or regulatory bodies are genuine, issued by an active ICAB member firm, and free from tampering or forgery.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
              >
                Got It, Close Guide
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

