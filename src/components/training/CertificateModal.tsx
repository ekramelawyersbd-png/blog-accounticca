import { useState, useRef, useEffect } from 'react';
import { X, Download, Award, CheckCircle2, ShieldCheck, Printer, Sparkles } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleTitle: string;
  defaultName?: string;
  courseId?: string;
}

export function CertificateModal({ isOpen, onClose, moduleTitle, defaultName = '', courseId }: CertificateModalProps) {
  const [recipientName, setRecipientName] = useState(defaultName || '');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [certId, setCertId] = useState('');
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (!recipientName) {
        // try loading from existing enrollments or previous certificate
        const saved = localStorage.getItem('user_full_name');
        if (saved) setRecipientName(saved);
      }
      const randomCode = Math.floor(100000 + Math.random() * 900000);
      setCertId(`EL-CERT-${courseId ? courseId.toUpperCase() : 'TRN'}-${randomCode}`);
    }
  }, [isOpen, courseId]);

  if (!isOpen) return null;

  const saveCertificateRecord = () => {
    if (!recipientName.trim()) return;
    try {
      localStorage.setItem('user_full_name', recipientName.trim());
      const existing = localStorage.getItem('training_certificates');
      const certificates = existing ? JSON.parse(existing) : [];
      const newCert = {
        id: certId,
        courseTitle: moduleTitle,
        recipientName: recipientName.trim(),
        issueDate,
        dateCreated: new Date().toISOString()
      };
      // Prevent duplicate for same course
      const filtered = certificates.filter((c: any) => c.courseTitle !== moduleTitle);
      filtered.push(newCert);
      localStorage.setItem('training_certificates', JSON.stringify(filtered));

      // Also mark completed
      const completed = JSON.parse(localStorage.getItem('completed_modules') || '[]');
      if (!completed.includes(moduleTitle)) {
        completed.push(moduleTitle);
        localStorage.setItem('completed_modules', JSON.stringify(completed));
      }
    } catch (e) {
      console.error('Failed to store certificate record', e);
    }
  };

  const handleDownloadPDF = async () => {
    if (!recipientName.trim()) return;
    setIsGenerating(true);
    saveCertificateRecord();

    try {
      if (!certRef.current) return;

      const canvas = await html2canvas(certRef.current, {
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
      pdf.save(`Certificate_${moduleTitle.replace(/\s+/g, '_')}_${recipientName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      // Fallback print
      window.print();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden my-8 border border-slate-200 print:shadow-none print:border-none print:max-w-none print:m-0">
        
        {/* Header - Hidden on Print */}
        <div className="flex justify-between items-center px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold">Certificate of Completion</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form & Preview */}
        <div className="p-6 md:p-8 space-y-6">
          
          {/* Controls Bar - Hidden on Print */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 items-end print:hidden">
            <div>
              <label htmlFor="recipientNameInput" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Your Full Name (for Certificate)
              </label>
              <input
                id="recipientNameInput"
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. Mohammad Ali"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="issueDateInput" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Completion Date
              </label>
              <input
                id="issueDateInput"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={!recipientName.trim() || isGenerating}
                className="flex-1 py-2.5 px-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download PDF
                  </>
                )}
              </button>
              <button
                onClick={() => window.print()}
                className="p-2.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl transition-colors"
                title="Print Certificate"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Certificate Printable Canvas */}
          <div className="overflow-x-auto p-1 bg-slate-100 rounded-2xl print:bg-white print:p-0">
            <div 
              ref={certRef}
              id="certificate-print-area"
              className="w-[800px] h-[560px] mx-auto bg-white p-8 relative flex flex-col justify-between border-[12px] border-slate-900 rounded-xl text-slate-900 shadow-md font-serif print:w-full print:h-screen print:border-[8px] print:rounded-none"
              style={{
                backgroundImage: 'radial-gradient(#f1f5f9 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            >
              {/* Inner Decorative Frame */}
              <div className="absolute inset-3 border-2 border-amber-500/60 pointer-events-none rounded-lg"></div>
              <div className="absolute inset-4 border border-slate-300 pointer-events-none rounded-lg"></div>

              {/* Top Seal & Academy Brand Header */}
              <div className="relative z-10 flex justify-between items-start pt-2 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 text-emerald-400 rounded-xl flex items-center justify-center font-bold font-sans text-xl shadow-md border border-slate-800">
                    E
                  </div>
                  <div className="text-left font-sans">
                    <div className="font-extrabold text-slate-900 text-lg tracking-tight">E-LAWYERS ACADEMY</div>
                    <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Center for Legal & Tax Education</div>
                  </div>
                </div>

                <div className="text-right font-sans text-xs text-slate-500">
                  <div>Verification Code:</div>
                  <div className="font-mono font-bold text-slate-800">{certId}</div>
                </div>
              </div>

              {/* Main Certificate Title & Body */}
              <div className="relative z-10 text-center my-auto px-6 space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-800 text-xs font-bold uppercase tracking-widest font-sans">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Official Certificate of Completion
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-slate-900 pt-2 font-serif">
                  PROUDLY PRESENTED TO
                </h1>

                <div className="py-2">
                  <span className="text-3xl md:text-4xl font-extrabold text-emerald-800 border-b-2 border-emerald-600 px-8 py-1 inline-block font-sans">
                    {recipientName || '[ Student Full Name ]'}
                  </span>
                </div>

                <p className="text-slate-600 text-sm max-w-xl mx-auto leading-relaxed font-sans">
                  for successfully completing the comprehensive training program and mastering all statutory requirements, legal frameworks, and practical exercises in:
                </p>

                <h2 className="text-2xl font-bold text-slate-900 font-sans tracking-wide text-slate-900 pt-1">
                  {moduleTitle}
                </h2>
              </div>

              {/* Bottom Signatures & Seal */}
              <div className="relative z-10 flex justify-between items-end pb-2 px-6 font-sans">
                <div className="text-left">
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Date of Issuance</div>
                  <div className="font-bold text-slate-800 text-sm">{issueDate}</div>
                </div>

                {/* Gold Seal Emblem */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-1 shadow-lg flex items-center justify-center text-slate-900">
                  <div className="w-full h-full rounded-full border-2 border-dashed border-amber-800/40 flex flex-col items-center justify-center text-center p-1 bg-amber-400/90">
                    <Award className="w-8 h-8 text-slate-900" />
                    <span className="text-[8px] font-extrabold uppercase tracking-tighter leading-none mt-0.5">VERIFIED</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="w-36 border-b border-slate-400 mb-1"></div>
                  <div className="font-bold text-slate-900 text-sm">Adv. Kamrul Hasan</div>
                  <div className="text-xs text-slate-500 font-medium">Head of Education, E-Lawyers</div>
                </div>
              </div>

            </div>
          </div>

          <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5 print:hidden">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Certificates generated through E-Lawyers are stored in your local training dashboard records.
          </div>

        </div>
      </div>
    </div>
  );
}
