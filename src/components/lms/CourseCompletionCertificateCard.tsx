import React, { useRef, useState, useEffect } from 'react';
import {
  Award,
  Download,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Eye,
  Copy,
  Check,
  Lock,
  QrCode,
  Printer
} from 'lucide-react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { LmsCourse } from '../../data/lmsCoursesData';
import {
  LmsCertificateRecord,
  StudentProfileRecord
} from '../../contexts/LmsContext';

interface CourseCompletionCertificateCardProps {
  course: LmsCourse;
  studentProfile: StudentProfileRecord;
  completionPercent: number;
  completedClassesCount: number;
  totalClassesCount: number;
  certificate: LmsCertificateRecord | null;
  onEnsureCertificate: () => LmsCertificateRecord | null;
  onOpenPreviewModal: (cert: LmsCertificateRecord) => void;
  onTriggerDemoCompleteAll?: () => void;
}

export const CourseCompletionCertificateCard: React.FC<
  CourseCompletionCertificateCardProps
> = ({
  course,
  studentProfile,
  completionPercent,
  completedClassesCount,
  totalClassesCount,
  certificate,
  onEnsureCertificate,
  onOpenPreviewModal,
  onTriggerDemoCompleteAll
}) => {
  const hiddenCertCanvasRef = useRef<HTMLDivElement>(null);
  const [issuedCert, setIssuedCert] = useState<LmsCertificateRecord | null>(certificate);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isHundredPercentComplete =
    completionPercent >= 100 ||
    (totalClassesCount > 0 && completedClassesCount >= totalClassesCount);

  // Automatically issue or retrieve certificate record as soon as course reaches 100% completion
  useEffect(() => {
    if (certificate) {
      setIssuedCert(certificate);
      return;
    }
    if (isHundredPercentComplete) {
      const generated = onEnsureCertificate();
      if (generated) {
        setIssuedCert(generated);
      }
    }
  }, [certificate, isHundredPercentComplete, onEnsureCertificate]);

  // Fallback deterministic certificate object if 100% complete
  const activeCert: LmsCertificateRecord = issuedCert ||
    certificate || {
      certificateId: `CERT-2026-ELAW-${course.courseId === 'personal-income-tax' ? '00101' : '00102'}`,
      userId: studentProfile.userId,
      studentId: studentProfile.studentId,
      studentName: studentProfile.fullName,
      courseId: course.courseId,
      courseTitle: course.title,
      issueDate: new Date().toISOString().split('T')[0],
      issuerOrganization: course.issuerOrganization,
      authorizedSignatory: course.authorizedSignatory,
      signatoryDesignation: course.signatoryDesignation,
      status: 'Valid',
      verificationUrl: `/verify-certificate?id=CERT-2026-ELAW-${
        course.courseId === 'personal-income-tax' ? '00101' : '00102'
      }`,
      createdAt: new Date().toISOString()
    };

  const fullVerifyUrl = `${window.location.origin}/verify-certificate?id=${encodeURIComponent(
    activeCert.certificateId
  )}`;

  const handleDirectDownloadPdf = async () => {
    const ensured = onEnsureCertificate() || activeCert;
    setIssuedCert(ensured);

    if (!hiddenCertCanvasRef.current) {
      onOpenPreviewModal(ensured);
      return;
    }

    setIsDownloadingPdf(true);
    setDownloadSuccess(false);

    try {
      // Allow state render cycle to settle before capturing canvas
      await new Promise((resolve) => setTimeout(resolve, 80));

      const canvas = await html2canvas(hiddenCertCanvasRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(
        `${ensured.certificateId}_${ensured.studentName.replace(/\s+/g, '_')}.pdf`
      );
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch {
      onOpenPreviewModal(ensured);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleCopyVerifyLink = () => {
    navigator.clipboard?.writeText(fullVerifyUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!isHundredPercentComplete) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span>Certificate Generation Milestone</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-emerald-700">
                {completionPercent}% Completed ({completedClassesCount}/{totalClassesCount} Classes)
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Complete 100% of Course Modules to Unlock Your Official Certificate
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Once your course progress reaches 100%, your celebratory mastery badge and instant PDF certificate download will activate here.
            </p>
          </div>
        </div>

        {onTriggerDemoCompleteAll && (
          <button
            type="button"
            onClick={onTriggerDemoCompleteAll}
            className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer transition-colors"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Simulate 100% Completion</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl border-2 border-emerald-500/80 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 text-white p-6 sm:p-8 shadow-lg overflow-hidden">
      {/* Subtle Architectural Gold/Emerald Accent Glow */}
      <div
        className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-amber-400/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Celebratory Mastery Badge & Course Completion Details (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Celebratory Seal Badge */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 p-0.5 shadow-xl">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex flex-col items-center justify-center text-center p-2">
                <Award className="w-8 h-8 sm:w-9 sm:h-9 text-amber-400" />
                <span className="text-[10px] font-extrabold tracking-widest uppercase text-amber-300 mt-1 font-mono tabular-nums">
                  100% DONE
                </span>
              </div>
            </div>
            <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Congratulations · 100% Course Completion Achieved</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Official Certificate of Professional Mastery Ready
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              <span className="font-semibold text-white">{studentProfile.fullName}</span> has
              completed all {totalClassesCount} mandatory classes and statutory assessments for{' '}
              <span className="font-semibold text-emerald-300">{course.title}</span>.
            </p>

            {/* Unboxed Metadata Strip */}
            <div className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 font-mono tabular-nums">
              <span className="text-emerald-300 font-semibold">
                ID: {activeCert.certificateId}
              </span>
              <span aria-hidden="true" className="text-slate-600">
                ·
              </span>
              <span>Issued: {activeCert.issueDate}</span>
              <span aria-hidden="true" className="text-slate-600">
                ·
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-sans font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Status: {activeCert.status}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Certificate Download & Verification Controls (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
          {/* Primary Direct PDF Download CTA */}
          <button
            type="button"
            onClick={handleDirectDownloadPdf}
            disabled={isDownloadingPdf}
            className="w-full py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg transition-colors cursor-pointer"
          >
            {isDownloadingPdf ? (
              <>
                <Printer className="w-4 h-4 animate-spin" />
                <span>Generating Official PDF Certificate...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Certificate Downloaded ({activeCert.certificateId}.pdf)</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Certificate (PDF)</span>
              </>
            )}
          </button>

          {/* Secondary Action Row: Preview Modal + Copy Link + Public Verification */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                const cert = onEnsureCertificate() || activeCert;
                setIssuedCert(cert);
                onOpenPreviewModal(cert);
              }}
              className="py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Preview</span>
            </button>

            <button
              type="button"
              onClick={handleCopyVerifyLink}
              className="py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <Link
              to={`/verify-certificate?id=${encodeURIComponent(activeCert.certificateId)}`}
              className="py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Verify ID</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Offscreen High-Resolution Printable Certificate Canvas for Instant One-Click PDF Generation */}
      <div
        className="fixed -left-[9999px] top-0 pointer-events-none opacity-0"
        aria-hidden="true"
      >
        <div
          ref={hiddenCertCanvasRef}
          className="w-[860px] min-h-[580px] bg-white p-10 border-[10px] border-slate-900 rounded-xl text-slate-900 flex flex-col justify-between relative"
        >
          <div className="absolute inset-3 border border-slate-300 pointer-events-none" />

          {/* Top Header Row */}
          <div className="relative z-10 flex items-start justify-between border-b border-slate-200 pb-5">
            <div>
              <div className="text-xs font-bold tracking-widest text-emerald-700 uppercase">
                {activeCert.issuerOrganization}
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                Certificate of Professional Mastery
              </div>
            </div>

            <div className="text-right font-mono tabular-nums">
              <div className="text-xs font-bold text-slate-900">
                Certificate ID: {activeCert.certificateId}
              </div>
              <div className="text-xs text-emerald-700 font-bold mt-0.5">
                Status: {activeCert.status} · 100% Completed
              </div>
            </div>
          </div>

          {/* Center Recipient & Course Statement */}
          <div className="relative z-10 my-8 text-center space-y-4 px-8">
            <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
              This is to certify that
            </div>

            <div className="text-4xl font-bold text-slate-900 tracking-tight border-b border-slate-300 pb-3 max-w-xl mx-auto">
              {activeCert.studentName}
            </div>

            <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
              has successfully completed 100% of the mandatory curriculum, statutory reading
              checkpoints, and module assessments for the professional program:
            </p>

            <div className="text-2xl font-bold text-emerald-800 max-w-2xl mx-auto">
              {activeCert.courseTitle}
            </div>
          </div>

          {/* Bottom Verification, Issue Date & Signature Row */}
          <div className="relative z-10 pt-5 border-t border-slate-200 grid grid-cols-3 items-end gap-6">
            <div className="space-y-1 text-left">
              <div className="text-xs text-slate-500">Issue Date</div>
              <div className="text-sm font-mono tabular-nums font-bold text-slate-900">
                {activeCert.issueDate}
              </div>
              <div className="text-[11px] font-mono text-slate-500 pt-1 break-all">
                Verify: {fullVerifyUrl}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center text-center">
              <div className="p-2.5 rounded-xl border border-slate-300 bg-slate-50 flex items-center gap-2">
                <QrCode className="w-9 h-9 text-slate-900 shrink-0" />
                <div className="text-left">
                  <div className="text-[10px] font-bold text-slate-900 uppercase">
                    QR Verified Credential
                  </div>
                  <div className="text-[10px] font-mono text-emerald-700 font-semibold">
                    {activeCert.certificateId}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="text-base font-bold italic text-slate-900 font-serif">
                {activeCert.authorizedSignatory}
              </div>
              <div className="border-t border-slate-400 pt-1 text-xs font-bold text-slate-900">
                {activeCert.authorizedSignatory}
              </div>
              <div className="text-[11px] text-slate-600">
                {activeCert.signatoryDesignation}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
