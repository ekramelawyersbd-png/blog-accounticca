import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  Printer,
  Award,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  QrCode
} from 'lucide-react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { LmsCertificateRecord } from '../../contexts/LmsContext';

interface LmsCertificateViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: LmsCertificateRecord | null;
}

export const LmsCertificateViewerModal: React.FC<LmsCertificateViewerModalProps> = ({
  isOpen,
  onClose,
  certificate
}) => {
  const certCanvasRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !certificate) return null;

  const handleDownloadPdf = async () => {
    if (!certCanvasRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(certCanvasRef.current, {
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
      // Same immutable Certificate ID is preserved across every download
      pdf.save(`${certificate.certificateId}_${certificate.studentName.replace(/\s+/g, '_')}.pdf`);
    } catch {
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  const fullVerifyUrl = `${window.location.origin}/verify-certificate?id=${encodeURIComponent(
    certificate.certificateId
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl overflow-hidden my-auto print:shadow-none print:border-none">
        {/* Top Action Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Official Course Completion Certificate
              </h2>
              <p className="text-xs text-slate-400 font-mono tabular-nums">
                Immutable ID: {certificate.certificateId} · Status: {certificate.status}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/verify-certificate?id=${encodeURIComponent(certificate.certificateId)}`}
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Public Verification Page</span>
            </Link>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading || certificate.status !== 'Valid'}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Generating PDF...' : 'Download Certificate (PDF)'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              title="Print Certificate"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Canvas */}
        <div className="p-4 sm:p-8 bg-slate-100 overflow-x-auto print:p-0 print:bg-white">
          <div
            ref={certCanvasRef}
            className="w-[860px] min-h-[580px] mx-auto bg-white p-10 border-[10px] border-slate-900 rounded-xl text-slate-900 flex flex-col justify-between relative shadow-sm"
          >
            {/* Inner Hairline Frame */}
            <div className="absolute inset-3 border border-slate-300 pointer-events-none" />

            {/* Top Header Row */}
            <div className="relative z-10 flex items-start justify-between border-b border-slate-200 pb-5">
              <div>
                <div className="text-xs font-bold tracking-widest text-emerald-700 uppercase">
                  {certificate.issuerOrganization}
                </div>
                <div className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                  Certificate of Professional Mastery
                </div>
              </div>

              <div className="text-right font-mono tabular-nums">
                <div className="text-xs font-bold text-slate-900">
                  Certificate ID: {certificate.certificateId}
                </div>
                <div className="text-xs text-slate-600 mt-0.5 flex items-center justify-end gap-1.5">
                  {certificate.status === 'Valid' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Status: Valid</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span className="text-rose-700 font-bold">Status: {certificate.status}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Center Recipient & Course Statement */}
            <div className="relative z-10 my-8 text-center space-y-4 px-8">
              <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
                This is to certify that
              </div>

              <div className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight border-b border-slate-300 pb-3 max-w-xl mx-auto">
                {certificate.studentName}
              </div>

              <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
                has successfully completed all 10 mandatory classes, statutory reading checkpoints,
                module assessments, and passed the Final Certification Examination for the program:
              </p>

              <div className="text-xl sm:text-2xl font-bold text-emerald-800 max-w-2xl mx-auto">
                {certificate.courseTitle}
              </div>
            </div>

            {/* Bottom Verification, Issue Date & Signature Row */}
            <div className="relative z-10 pt-5 border-t border-slate-200 grid grid-cols-3 items-end gap-6">
              {/* Left: Issue Date & Verification URL */}
              <div className="space-y-1 text-left">
                <div className="text-xs text-slate-500">Issue Date</div>
                <div className="text-sm font-mono tabular-nums font-bold text-slate-900">
                  {certificate.issueDate}
                </div>
                <div className="text-[11px] font-mono text-slate-500 pt-1 break-all">
                  Verify: {fullVerifyUrl}
                </div>
              </div>

              {/* Center: QR Verification Seal */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="p-2.5 rounded-xl border border-slate-300 bg-slate-50 flex items-center gap-2">
                  <QrCode className="w-9 h-9 text-slate-900 shrink-0" />
                  <div className="text-left">
                    <div className="text-[10px] font-bold text-slate-900 uppercase">
                      QR Verified Credential
                    </div>
                    <div className="text-[10px] font-mono text-emerald-700 font-semibold">
                      {certificate.certificateId}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Authorized Signatory */}
              <div className="text-right space-y-1">
                <div className="text-base font-bold italic text-slate-900 font-serif">
                  {certificate.authorizedSignatory}
                </div>
                <div className="border-t border-slate-400 pt-1 text-xs font-bold text-slate-900">
                  {certificate.authorizedSignatory}
                </div>
                <div className="text-[11px] text-slate-600">
                  {certificate.signatoryDesignation}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="bg-white border-t border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 print:hidden">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Repeated downloads always retain the exact same Certificate ID ({certificate.certificateId}).
            </span>
          </div>
          <span>Verify publicly at /verify-certificate</span>
        </div>
      </div>
    </div>
  );
};
