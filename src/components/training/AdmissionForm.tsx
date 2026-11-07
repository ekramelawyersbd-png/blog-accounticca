import React, { useState } from 'react';
import { GraduationCap, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { saveTrainingAdmissionToFirestore } from '../../services/trainingAdmissionFirestoreService';

export interface AdmissionFormProps {
  initialCourseId?: string;
  initialCourseName?: string;
  userEmail?: string | null;
  userName?: string | null;
  onSuccess?: (admissionId: string) => void;
  className?: string;
}

export const AdmissionForm: React.FC<AdmissionFormProps> = ({
  initialCourseId = 'course-400',
  initialCourseName = 'Practical Income Tax & VAT Management',
  userEmail,
  userName,
  onSuccess,
  className = '',
}) => {
  const [applicantName, setApplicantName] = useState(userName || '');
  const [email, setEmail] = useState(userEmail || '');
  const [phone, setPhone] = useState('');
  const [courseId, setCourseId] = useState(initialCourseId);
  const [courseName, setCourseName] = useState(initialCourseName);
  const [qualification, setQualification] = useState('Bachelor in Law / Accounting / Finance');
  const [experience, setExperience] = useState('1–3 Years');
  const [motivation, setMotivation] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const coursesList = [
    { id: 'course-400', name: 'Practical Income Tax & VAT Management' },
    { id: 'course-401', name: 'Company Secretarial Practice & RJSC Compliance' },
    { id: 'course-402', name: 'Labour Law & Employment Dispute Resolution' },
    { id: 'course-403', name: 'Bar Council & High Court Litigant Prep' },
    { id: 'course-404', name: 'Corporate Legal Drafting & Compliance' },
  ];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!applicantName.trim()) {
      newErrors.applicantName = 'Full applicant name is required.';
    } else if (applicantName.trim().length < 2) {
      newErrors.applicantName = 'Name must be at least 2 characters.';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!phone.trim()) {
      newErrors.phone = 'Phone or WhatsApp number is required.';
    } else if (cleanPhone.length < 8 || cleanPhone.length > 15) {
      newErrors.phone = 'Please enter a valid phone number containing 8–15 digits.';
    }

    if (!courseId) {
      newErrors.course = 'Please select a training course.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCourseChange = (id: string) => {
    setCourseId(id);
    const found = coursesList.find((c) => c.id === id);
    if (found) {
      setCourseName(found.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    if (!validate()) {
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

      setSuccessMessage(`Application [${record.id}] submitted successfully! Awaiting admin approval for /student/dashboard access.`);
      if (onSuccess) {
        onSuccess(record.id);
      }
    } catch (err: any) {
      setErrors({ submit: err?.message || 'Failed to submit admission application.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 ${className}`}>
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
            Academy Intake Desk
          </span>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
            Training Course Admission Form
          </h3>
        </div>
      </div>

      {successMessage ? (
        <div className="p-8 text-center bg-emerald-50/80 border border-emerald-300 rounded-2xl space-y-3 animate-in fade-in">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h4 className="text-base font-black text-emerald-950">Application Filed Successfully</h4>
          <p className="text-xs text-emerald-900 leading-relaxed max-w-md mx-auto">{successMessage}</p>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="mt-3 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Submit Another Application
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {errors.submit && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-950 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errors.submit}</span>
            </div>
          )}

          <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Verified applicants receive view-only access to course materials in <strong className="font-bold">/student/dashboard</strong> upon admin approval.</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Applicant Name *</label>
            <input
              type="text"
              placeholder="e.g. Adv. Tanvir Ahmed"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 ${
                errors.applicantName ? 'border-rose-400 ring-rose-200 bg-rose-50/20' : 'border-slate-200 focus:ring-blue-600'
              }`}
            />
            {errors.applicantName && <p className="mt-1 text-[11px] font-semibold text-rose-700">{errors.applicantName}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 ${
                  errors.email ? 'border-rose-400 ring-rose-200 bg-rose-50/20' : 'border-slate-200 focus:ring-blue-600'
                }`}
              />
              {errors.email && <p className="mt-1 text-[11px] font-semibold text-rose-700">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone / WhatsApp Number *</label>
              <input
                type="tel"
                placeholder="+880 1712-345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 ${
                  errors.phone ? 'border-rose-400 ring-rose-200 bg-rose-50/20' : 'border-slate-200 focus:ring-blue-600'
                }`}
              />
              {errors.phone && <p className="mt-1 text-[11px] font-semibold text-rose-700">{errors.phone}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Training Course *</label>
            <select
              value={courseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 ${
                errors.course ? 'border-rose-400 ring-rose-200 bg-rose-50/20' : 'border-slate-200 focus:ring-blue-600'
              }`}
            >
              {coursesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.course && <p className="mt-1 text-[11px] font-semibold text-rose-700">{errors.course}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Academic Qualification</label>
              <select
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
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
              placeholder="Briefly state your objective for enrolling..."
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"></div>
                  <span>Submitting Application to Backend...</span>
                </>
              ) : (
                <>
                  <span>Submit Admission Application</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdmissionForm;
