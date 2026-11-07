import React, { useState } from 'react';
import { X, GraduationCap, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { saveTrainingAdmissionToFirestore } from '../../services/trainingAdmissionFirestoreService';

export interface TrainingAdmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
  userEmail?: string | null;
  userName?: string | null;
}

export const TrainingAdmissionModal: React.FC<TrainingAdmissionModalProps> = ({
  isOpen,
  onClose,
  courseId,
  courseName,
  userEmail,
  userName,
}) => {
  const [applicantName, setApplicantName] = useState(userName || '');
  const [email, setEmail] = useState(userEmail || '');
  const [phone, setPhone] = useState('');
  const [qualification, setQualification] = useState('Bachelor in Law / Accounting / Finance');
  const [experience, setExperience] = useState('1–3 Years');
  const [motivation, setMotivation] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!applicantName.trim() || !email.trim() || !phone.trim()) {
      setError('Please provide your name, email, and phone/WhatsApp number.');
      return;
    }

    setSubmitting(true);
    try {
      const record = await saveTrainingAdmissionToFirestore({
        applicantName: applicantName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        courseId,
        courseName,
        qualification,
        experience,
        motivation: motivation.trim(),
        status: 'pending',
        appliedAt: new Date().toISOString(),
      });

      setSuccess(`Admission application [${record.id}] successfully submitted for "${courseName}". Awaiting admin approval for /student/dashboard access.`);
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 3500);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit admission application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-950 text-white px-6 py-5 flex items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Course Admission Form
              </span>
              <h3 className="text-base font-black text-white mt-0.5 truncate max-w-sm">
                {courseName}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {success ? (
            <div className="p-6 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-950 space-y-3 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="text-base font-black">Application Submitted Successfully!</h4>
              <p className="text-xs leading-relaxed">{success}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-950 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Upon admin approval, this email will automatically unlock view-only access in <strong className="font-bold">/student/dashboard</strong> for this course.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Applicant Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adv. Tanvir Ahmed"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone / WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+880 1712-345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Academic &amp; Professional Qualification</label>
                  <select
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="LL.B / LL.M / Advocate">LL.B / LL.M / Advocate</option>
                    <option value="ACA / FCA / ACMA / FCMA">ACA / FCA / ACMA / FCMA</option>
                    <option value="MBA / Masters in Finance / Economics">MBA / Masters in Finance / Economics</option>
                    <option value="Bachelor in Law / Accounting / Finance">Bachelor in Law / Accounting / Finance</option>
                    <option value="Corporate Executive / Tax Practitioner">Corporate Executive / Tax Practitioner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Professional Experience</label>
                  <select
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="0-1 Year (Fresh Graduate)">0-1 Year (Fresh Graduate)</option>
                    <option value="1–3 Years">1–3 Years</option>
                    <option value="3–5 Years">3–5 Years</option>
                    <option value="5+ Years Senior Professional">5+ Years Senior Professional</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Professional Motivation (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Briefly state why you wish to enroll in this course..."
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Submitting Application...' : 'Submit Admission Application'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingAdmissionModal;
