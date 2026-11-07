import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Award,
  ArrowLeft,
  Lock
} from 'lucide-react';
import { useLms, PublicCertificateVerificationResult } from '../contexts/LmsContext';
import { ServiceSEO } from '../components/SEO';

export const PublicCertificateVerifyPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { verifyCertificatePublic, allCertificates } = useLms();

  const initialId = searchParams.get('id') || '';
  const [certificateIdInput, setCertificateIdInput] = useState(initialId);
  const [studentNameInput, setStudentNameInput] = useState('');
  const [verificationResult, setVerificationResult] =
    useState<PublicCertificateVerificationResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialId) {
      setCertificateIdInput(initialId);
      const res = verifyCertificatePublic(initialId, '');
      setVerificationResult(res);
      setHasSearched(true);
    }
  }, [initialId, verifyCertificatePublic]);

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificateIdInput.trim()) return;
    const res = verifyCertificatePublic(certificateIdInput, studentNameInput);
    setVerificationResult(res);
    setHasSearched(true);
    setSearchParams({ id: certificateIdInput.trim().toUpperCase() });
  };

  const handleQuickLookup = (certId: string) => {
    setCertificateIdInput(certId);
    setStudentNameInput('');
    const res = verifyCertificatePublic(certId, '');
    setVerificationResult(res);
    setHasSearched(true);
    setSearchParams({ id: certId });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <ServiceSEO
        title="Certificate Verification | Public Credential Registry"
        description="Verify the authenticity of a certificate issued by E-Lawyers Academy & Accounticca Professional Institute."
        serviceType="Public Certificate Verification"
        canonicalUrl="/verify-certificate"
      />

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/student/dashboard"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Student Learning Portal</span>
          </Link>
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Public Credential Registry (No Login Required)</span>
          </span>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
            Certificate Verification
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Verify the authenticity of a certificate issued by our learning platform.
          </p>
        </div>

        {/* Search Form Card */}
        <div className="app-form-60 w-full lg:w-[60vw] mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <form onSubmit={handleVerifySubmit} className="w-full space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="verify-cert-id"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  Certificate ID *
                </label>
                <input
                  id="verify-cert-id"
                  type="text"
                  value={certificateIdInput}
                  onChange={(e) => setCertificateIdInput(e.target.value)}
                  placeholder="e.g. CERT-2026-ELAW-00101"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase text-slate-900 focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="verify-student-name"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  Student Name (optional)
                </label>
                <input
                  id="verify-student-name"
                  type="text"
                  value={studentNameInput}
                  onChange={(e) => setStudentNameInput(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>Try sample registry IDs:</span>
                {allCertificates.slice(0, 3).map((c) => (
                  <button
                    key={c.certificateId}
                    type="button"
                    onClick={() => handleQuickLookup(c.certificateId)}
                    className="font-mono text-emerald-700 hover:underline font-semibold cursor-pointer"
                  >
                    {c.certificateId} ({c.status})
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4 text-emerald-400" />
                <span>Verify Certificate</span>
              </button>
            </div>
          </form>

          {/* Privacy Guarantee Notice */}
          <div className="pt-4 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-500">
            <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              <strong>Privacy Protection Rule:</strong> Public verification displays only credential authenticity fields (Status, Recipient Name, Course Title, Issue Date, Certificate ID, and Issuing Organization). Student email addresses, mobile numbers, Student IDs, and examination marks are strictly hidden.
            </span>
          </div>
        </div>

        {/* Verification Result Display */}
        {hasSearched && verificationResult && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
            {verificationResult.lookupStatus === 'not_found' ? (
              <div className="flex items-start gap-4 text-rose-900 bg-rose-50/70 border border-rose-200 rounded-xl p-5">
                <XCircle className="w-7 h-7 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-rose-950">Certificate Not Found</h2>
                  <p className="text-xs sm:text-sm text-rose-800">
                    No matching credential was found for Certificate ID{' '}
                    <strong className="font-mono">{certificateIdInput.toUpperCase()}</strong>
                    {studentNameInput ? ` and Student Name "${studentNameInput}"` : ''}. Please verify the ID printed on the certificate.
                  </p>
                </div>
              </div>
            ) : verificationResult.certificateStatus === 'Revoked' ? (
              <div className="space-y-5">
                <div className="flex items-start gap-4 text-rose-950 bg-rose-50 border border-rose-300 rounded-xl p-5">
                  <AlertTriangle className="w-7 h-7 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold">Certificate Revoked</h2>
                    <p className="text-xs sm:text-sm text-rose-800">
                      This certificate was revoked by the issuing authority and is no longer valid.
                      {verificationResult.revocationReason
                        ? ` Reason: ${verificationResult.revocationReason}`
                        : ''}
                    </p>
                  </div>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-2">
                  <div>
                    <dt className="text-xs text-slate-500">Certificate Status</dt>
                    <dd className="font-bold text-rose-700 mt-0.5">Certificate Revoked</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Certificate ID</dt>
                    <dd className="font-mono tabular-nums font-bold text-slate-900 mt-0.5">
                      {verificationResult.certificateId}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Recipient Name</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">
                      {verificationResult.studentName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Course Name</dt>
                    <dd className="font-medium text-slate-800 mt-0.5">
                      {verificationResult.courseTitle}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4 bg-emerald-50/80 border border-emerald-300 rounded-xl p-5">
                  <div className="flex items-start gap-3.5">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h2 className="text-lg font-bold text-emerald-950">
                        Certificate Status: {verificationResult.certificateStatus}
                      </h2>
                      <p className="text-xs sm:text-sm text-emerald-800">
                        This credential is authentic and verified in the official academy registry.
                      </p>
                    </div>
                  </div>
                  <Award className="w-8 h-8 text-emerald-600 shrink-0 hidden sm:block" />
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm border-t border-slate-100 pt-5">
                  <div>
                    <dt className="text-xs text-slate-500">Certificate Status</dt>
                    <dd className="font-bold text-emerald-700 mt-0.5">
                      {verificationResult.certificateStatus}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Certificate ID</dt>
                    <dd className="font-mono tabular-nums font-bold text-slate-900 mt-0.5">
                      {verificationResult.certificateId}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Student Name (As Displayed on Certificate)</dt>
                    <dd className="font-bold text-slate-900 text-base mt-0.5">
                      {verificationResult.studentName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Issue Date</dt>
                    <dd className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
                      {verificationResult.issueDate}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-slate-500">Course Name</dt>
                    <dd className="font-bold text-slate-900 mt-0.5">
                      {verificationResult.courseTitle}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-slate-500">Issuing Organization</dt>
                    <dd className="font-semibold text-slate-800 mt-0.5">
                      {verificationResult.issuerOrganization} · Signed by{' '}
                      {verificationResult.authorizedSignatory}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
