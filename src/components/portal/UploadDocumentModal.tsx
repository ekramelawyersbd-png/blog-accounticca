import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Check, 
  AlertCircle, 
  ShieldCheck,
  Building2,
  Calendar,
  Lock,
  Plus
} from 'lucide-react';
import { ClientDocument, saveClientDocument } from '../../services/clientDocumentService';
import { Appointment } from '../../services/appointmentService';
import { addClientActivity } from '../../services/clientActivityService';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
  appointments: Appointment[];
  onDocumentUploaded: (newDoc: ClientDocument) => void;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
  appointments,
  onDocumentUploaded
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState<ClientDocument['category']>('Tax Filings & NBR');
  const [consultationRef, setConsultationRef] = useState(appointments[0]?.referenceId || '');
  const [clientNotes, setClientNotes] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFakeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setFileSize(`${sizeMb} MB`);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a document title.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const selectedAppointment = appointments.find(a => a.referenceId === consultationRef);

      const ext = fileName.split('.').pop()?.toLowerCase();
      const fileType: ClientDocument['fileType'] = 
        ext === 'xlsx' || ext === 'xls' ? 'xlsx' :
        ext === 'docx' || ext === 'doc' ? 'docx' :
        ext === 'cert' ? 'cert' : 'pdf';

      const newDoc = await saveClientDocument(userId, {
        title: title.trim(),
        subtitle: subtitle.trim() || `Client uploaded file for consultation review`,
        category,
        fileType,
        fileSize: fileSize || '1.2 MB',
        sharedDate: today,
        lastUpdated: today,
        consultationRef: consultationRef || undefined,
        practiceArea: selectedAppointment?.practiceArea || undefined,
        status: 'Client Review Required',
        author: {
          name: userName || 'Client Partner',
          role: 'Authorized Client Submission',
          division: selectedAppointment?.division === 'E-Lawyers Chambers' ? 'E-Lawyers Chambers' : 'Accounticca Advisory'
        },
        summary: clientNotes.trim() || `Client uploaded ${title} for review by the chamber advisory team.`,
        contentPreview: `CLIENT DOCUMENT UPLOAD RECORD
Uploaded By: ${userName} (${userEmail})
Matter Reference: ${consultationRef || 'General Advisory'}
Document Name: ${fileName || title}

CLIENT BRIEF / INSTRUCTIONS:
${clientNotes || 'Attached for partner review during upcoming consultation session.'}

CONFIDENTIALITY:
Protected under advocate-client legal privilege.`,
        isConfidential: true,
        uploadedByClient: true,
        clientNotes: clientNotes.trim(),
        verificationCode: `CLT-${Math.floor(10000 + Math.random() * 90000)}`
      });

      // Stream to Client Activity Feed
      addClientActivity({
        type: 'document_upload',
        title: `Uploaded ${title.trim()}`,
        description: clientNotes.trim() || `Client uploaded ${title.trim()} (${fileSize || '1.2 MB'}) for review.`,
        clientName: userName || 'Client Partner',
        clientCompany: 'Corporate Client Portal',
        clientEmail: userEmail || 'client@accounticca.com',
        status: 'in_review',
        practiceArea: category === 'Tax Filings & NBR' ? 'Corporate Tax & NBR' : category === 'VAT & Customs' ? 'VAT & Customs' : 'Corporate Law',
        referenceId: consultationRef || `DOC-${Date.now().toString().slice(-4)}`,
        fileInfo: {
          fileName: fileName || `${title.replace(/\s+/g, '_')}.${fileType}`,
          fileSize: fileSize || '1.2 MB',
          fileType: fileType
        },
        sourceChannel: 'Client Portal (Web SSL)',
        notes: clientNotes.trim() || 'Uploaded via client portal document vault.'
      });

      onDocumentUploaded(newDoc);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Upload Document to Vault</h3>
              <p className="text-[11px] text-slate-400">Share contracts, bank statements, or NBR notices directly with your chamber partner</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* File Picker */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Select Document File (PDF, DOCX, XLSX) *
            </label>
            <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
              <Upload className="w-6 h-6 text-emerald-600 mb-1.5" />
              <span className="font-bold text-slate-800 text-xs">
                {fileName ? fileName : 'Click to browse or drop file here'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {fileSize ? `Selected: ${fileSize}` : 'PDF, Word, or Excel up to 25MB'}
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg"
                onChange={handleFakeFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Title */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Document Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Bank Statements & TDS Certificates (FY 2025-26)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
            />
          </div>

          {/* Category & Consultation Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
              >
                <option value="Tax Filings & NBR">Tax Filings &amp; NBR</option>
                <option value="Legal Deeds & Contracts">Legal Deeds &amp; Contracts</option>
                <option value="VAT & Customs">VAT &amp; Customs</option>
                <option value="Assurance & Audit">Assurance &amp; Audit</option>
                <option value="Advisory Memos">Advisory Memos</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Link to Consultation
              </label>
              <select
                value={consultationRef}
                onChange={(e) => setConsultationRef(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-mono"
              >
                <option value="">General Corporate (No Specific Session)</option>
                {appointments.map((apt) => (
                  <option key={apt.referenceId} value={apt.referenceId}>
                    {apt.referenceId} - {apt.practiceArea.slice(0, 24)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes for Chamber Partner */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Notes / Instructions for Chamber Partner
            </label>
            <textarea
              rows={3}
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              placeholder="Outline what specific advice you need on this document (e.g., check Section 46 rebate admissibility, verify indemnification clause)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 resize-none leading-relaxed"
            />
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 flex items-center gap-2 text-[11px] text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Files are encrypted at rest with AES-256 and only accessible to assigned partners.</span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold transition-all shadow-sm cursor-pointer"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Encrypting &amp; Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload to Vault</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
