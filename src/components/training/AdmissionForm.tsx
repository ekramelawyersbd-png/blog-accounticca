import React, { useState, useId } from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  MonitorPlay, 
  Sparkles,
  Check,
  Clock,
  FileEdit,
  Send,
  UserCheck,
  Award
} from 'lucide-react';
import { saveTrainingAdmissionToFirestore } from '../../services/trainingAdmissionFirestoreService';

export interface AdmissionFormProps {
  initialCourseId?: string;
  initialCourseName?: string;
  userEmail?: string | null;
  userName?: string | null;
  onSuccess?: (admissionId: string) => void;
  className?: string;
}

export type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'approved';

export const AdmissionForm: React.FC<AdmissionFormProps> = ({
  initialCourseId = 'course-400',
  initialCourseName = 'Practical Income Tax & VAT Management',
  userEmail,
  userName,
  onSuccess,
  className = '',
}) => {
  const formId = useId();

  // Form Fields
  const [applicantName, setApplicantName] = useState(userName || '');
  const [email, setEmail] = useState(userEmail || '');
  const [phone, setPhone] = useState('');
  const [courseId, setCourseId] = useState(initialCourseId);
  const [courseName, setCourseName] = useState(initialCourseName);
  const [qualification, setQualification] = useState('Bachelor in Law / Accounting / Finance');
  const [experience, setExperience] = useState('1–3 Years');
  const [motivation, setMotivation] = useState('');

  // Real-Time Touch & Validation State
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Application Lifecycle Status: 'draft' -> 'submitted' -> 'under_review' -> 'approved'
  const [appStatus, setAppStatus] = useState<ApplicationStatus>('draft');
  const [submittedRecordId, setSubmittedRecordId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const coursesList = [
    { id: 'course-400', name: 'Practical Income Tax & VAT Management' },
    { id: 'course-401', name: 'Company Secretarial Practice & RJSC Compliance' },
    { id: 'course-402', name: 'Labour Law & Employment Dispute Resolution' },
    { id: 'course-403', name: 'Bar Council & High Court Litigant Prep' },
    { id: 'course-404', name: 'Corporate Legal Drafting & Compliance' },
  ];

  // Live Field Validation Logic
  const validateField = (field: string, value: string): string | null => {
    if (field === 'applicantName') {
      if (!value.trim()) return 'Full applicant name is required.';
      if (value.trim().length < 2) return 'Name must be at least 2 characters.';
      if (!/^[a-zA-Z\s.,'-]+$/.test(value.trim())) return 'Name should contain letters and standard punctuation only.';
      return null;
    }

    if (field === 'email') {
      if (!value.trim()) return 'Email address is required.';
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(value.trim())) return 'Please enter a valid email address (e.g. name@domain.com).';
      return null;
    }

    if (field === 'phone') {
      if (!value.trim()) return 'Phone or WhatsApp number is required.';
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length < 8) return 'Phone number must contain at least 8 digits.';
      if (digitsOnly.length > 15) return 'Phone number cannot exceed 15 digits.';
      return null;
    }

    if (field === 'courseId') {
      if (!value) return 'Please select a training course.';
      return null;
    }

    return null;
  };

  // Field Errors dictionary derived dynamically
  const errors: Record<string, string | null> = {
    applicantName: validateField('applicantName', applicantName),
    email: validateField('email', email),
    phone: validateField('phone', phone),
    courseId: validateField('courseId', courseId),
  };

  const isNameValid = !errors.applicantName;
  const isEmailValid = !errors.email;
  const isPhoneValid = !errors.phone;
  const isCourseValid = !errors.courseId;

  const validRequiredCount = [isNameValid, isEmailValid, isPhoneValid, isCourseValid].filter(Boolean).length;
  const isFormValid = validRequiredCount === 4;
  const completionPercentage = Math.round((validRequiredCount / 4) * 100);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleChange = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'applicantName') setApplicantName(value);
    if (field === 'email') setEmail(value);
    if (field === 'phone') setPhone(value);
    if (field === 'motivation') setMotivation(value);
  };

  const handleCourseChange = (id: string) => {
    setCourseId(id);
    setTouched((prev) => ({ ...prev, courseId: true }));
    const found = coursesList.find((c) => c.id === id);
    if (found) {
      setCourseName(found.name);
    }
  };

  const handleResetForm = () => {
    setApplicantName(userName || '');
    setEmail(userEmail || '');
    setPhone('');
    setMotivation('');
    setQualification('Bachelor in Law / Accounting / Finance');
    setExperience('1–3 Years');
    setTouched({});
    setSubmitError(null);
    setSuccessMessage(null);
    setSubmittedRecordId(null);
    setAppStatus('draft');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Mark all required fields as touched
    setTouched({
      applicantName: true,
      email: true,
      phone: true,
      courseId: true,
    });

    if (!isFormValid) {
      setSubmitError('Please fix the highlighted errors before submitting your application.');
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

      setSubmittedRecordId(record.id);
      setAppStatus('submitted');
      setSuccessMessage(`Application [${record.id}] submitted successfully for "${courseName}". Admissions Desk has placed it Under Review.`);

      // Update to 'under_review' after brief confirmation
      setTimeout(() => {
        setAppStatus('under_review');
      }, 1200);

      // Clear form input fields
      setApplicantName('');
      setEmail('');
      setPhone('');
      setMotivation('');
      setTouched({});

      if (onSuccess) {
        onSuccess(record.id);
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to submit admission application.');
    } finally {
      setSubmitting(false);
    }
  };

  // Timeline Step metadata
  const steps = [
    {
      id: 'draft',
      label: '1. Form Draft',
      desc: 'Real-time Input Validation',
      icon: FileEdit,
      statusKey: 'draft',
    },
    {
      id: 'submitted',
      label: '2. Submitted',
      desc: 'Application Recorded',
      icon: Send,
      statusKey: 'submitted',
    },
    {
      id: 'under_review',
      label: '3. Under Review',
      desc: 'Admissions Desk Verification',
      icon: Clock,
      statusKey: 'under_review',
    },
    {
      id: 'approved',
      label: '4. Portal Access',
      desc: '/student/dashboard Unlocked',
      icon: UserCheck,
      statusKey: 'approved',
    },
  ];

  const getStepIndex = (status: ApplicationStatus) => {
    switch (status) {
      case 'draft':
        return 0;
      case 'submitted':
        return 1;
      case 'under_review':
        return 2;
      case 'approved':
        return 3;
      default:
        return 0;
    }
  };

  const currentStepIndex = getStepIndex(appStatus);

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 ${className}`}>
      {/* Visual Status Step Indicator Header */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Academy Intake Desk
                </span>
                {appStatus === 'draft' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Drafting ({completionPercentage}%)
                  </span>
                )}
                {appStatus === 'submitted' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                    <Check className="w-3 h-3 text-blue-600" />
                    Submitted
                  </span>
                )}
                {appStatus === 'under_review' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200">
                    <Clock className="w-3 h-3 text-purple-600 animate-spin" />
                    Under Review
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                Training Course Admission Form
              </h3>
            </div>
          </div>

          {/* Right Status Badge Indicator */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-mono font-semibold flex items-center gap-1.5 shadow-2xs">
              <span className="text-slate-400">Status:</span>
              <span className="text-emerald-400 capitalize font-extrabold">{appStatus.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Visual Stepper Pipeline */}
        <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {steps.map((st, idx) => {
              const isDone = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const StepIcon = st.icon;

              return (
                <div
                  key={st.id}
                  className={`flex items-center gap-2.5 p-2 rounded-xl transition-all ${
                    isCurrent
                      ? 'bg-emerald-600 text-white shadow-md font-bold'
                      : isDone
                      ? 'bg-emerald-100/70 text-emerald-900 border border-emerald-200'
                      : 'bg-white text-slate-400 border border-slate-100'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? 'bg-white/20 text-white'
                        : isDone
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : <StepIcon className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[11px] leading-tight font-extrabold truncate ${isCurrent ? 'text-white' : isDone ? 'text-emerald-950' : 'text-slate-700'}`}>
                      {st.label}
                    </p>
                    <p className={`text-[9px] truncate ${isCurrent ? 'text-emerald-100' : isDone ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {st.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Success View */}
      {successMessage ? (
        <div className="p-6 sm:p-8 text-center bg-gradient-to-b from-emerald-50 via-emerald-50/90 to-teal-50/60 border border-emerald-300 rounded-3xl space-y-4 animate-in fade-in zoom-in duration-200 shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 border border-emerald-300 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>

          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-extrabold bg-emerald-200/80 text-emerald-950 border border-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>Application ID: {submittedRecordId}</span>
            </span>
            <h4 className="text-lg font-black text-slate-900">Admission Application Received!</h4>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-md mx-auto">
            {successMessage} Form fields have been reset. Our administration desk will review your details and grant student portal access.
          </p>

          <div className="p-3 bg-white/80 rounded-2xl border border-emerald-200 text-xs text-slate-700 flex items-center justify-between max-w-md mx-auto font-mono">
            <span>Progress Status:</span>
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 animate-spin text-purple-600" /> Under Review
            </span>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-extrabold transition shadow-sm cursor-pointer"
            >
              Submit Another Application
            </button>

            <Link
              to="/student/dashboard"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-extrabold transition shadow-sm flex items-center gap-1.5"
            >
              <MonitorPlay className="w-4 h-4 text-emerald-400" />
              <span>Go to Student Portal</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Admission Form with Live Input Validation */
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {submitError && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-950 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Validation Progress Bar */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between font-extrabold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                Real-Time Form Validation Progress
              </span>
              <span className="text-emerald-700 font-mono">{validRequiredCount} / 4 required fields valid</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Verified applicants receive view-only access to course materials in <strong className="font-bold">/student/dashboard</strong> upon admin approval.</span>
          </div>

          {/* Full Name Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor={`${formId}-applicantName`} className="block text-xs font-bold text-slate-700">Full Applicant Name *</label>
              {touched.applicantName && (
                <span className="text-[10px] font-bold font-mono">
                  {isNameValid ? (
                    <span className="text-emerald-600 flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Valid Name
                    </span>
                  ) : (
                    <span className="text-rose-600">Invalid</span>
                  )}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                id={`${formId}-applicantName`}
                type="text"
                placeholder="e.g. Adv. Tanvir Ahmed"
                value={applicantName}
                onChange={(e) => handleChange('applicantName', e.target.value)}
                onBlur={() => handleBlur('applicantName')}
                className={`w-full px-3.5 py-2.5 pr-10 bg-slate-50 border rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none transition ${
                  touched.applicantName
                    ? isNameValid
                      ? 'border-emerald-500 bg-emerald-50/20 focus:ring-2 focus:ring-emerald-400'
                      : 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-2 focus:ring-blue-600'
                }`}
              />
              {touched.applicantName && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {isNameValid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  )}
                </div>
              )}
            </div>
            {touched.applicantName && errors.applicantName && (
              <p className="mt-1 text-[11px] font-semibold text-rose-700 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                <span>{errors.applicantName}</span>
              </p>
            )}
          </div>

          {/* Email & Phone Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Email Address */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor={`${formId}-email`} className="block text-xs font-bold text-slate-700">Email Address *</label>
                {touched.email && (
                  <span className="text-[10px] font-bold font-mono">
                    {isEmailValid ? (
                      <span className="text-emerald-600 flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Valid Format
                      </span>
                    ) : (
                      <span className="text-rose-600">Invalid Email</span>
                    )}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  id={`${formId}-email`}
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={`w-full px-3.5 py-2.5 pr-10 bg-slate-50 border rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none transition ${
                    touched.email
                      ? isEmailValid
                        ? 'border-emerald-500 bg-emerald-50/20 focus:ring-2 focus:ring-emerald-400'
                        : 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-2 focus:ring-blue-600'
                  }`}
                />
                {touched.email && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {isEmailValid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                    )}
                  </div>
                )}
              </div>
              {touched.email && errors.email && (
                <p className="mt-1 text-[11px] font-semibold text-rose-700 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor={`${formId}-phone`} className="block text-xs font-bold text-slate-700">Phone / WhatsApp Number *</label>
                {touched.phone && (
                  <span className="text-[10px] font-bold font-mono">
                    {isPhoneValid ? (
                      <span className="text-emerald-600 flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Valid Phone
                      </span>
                    ) : (
                      <span className="text-rose-600">Invalid</span>
                    )}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  id={`${formId}-phone`}
                  type="tel"
                  placeholder="+880 1712-345678"
                  value={phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  className={`w-full px-3.5 py-2.5 pr-10 bg-slate-50 border rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none transition ${
                    touched.phone
                      ? isPhoneValid
                        ? 'border-emerald-500 bg-emerald-50/20 focus:ring-2 focus:ring-emerald-400'
                        : 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-2 focus:ring-blue-600'
                  }`}
                />
                {touched.phone && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {isPhoneValid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                    )}
                  </div>
                )}
              </div>
              {touched.phone && errors.phone && (
                <p className="mt-1 text-[11px] font-semibold text-rose-700 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                  <span>{errors.phone}</span>
                </p>
              )}
            </div>
          </div>

          {/* Select Course */}
          <div>
            <label htmlFor={`${formId}-course`} className="block text-xs font-bold text-slate-700 mb-1">Select Training Course *</label>
            <select
              id={`${formId}-course`}
              value={courseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {coursesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Qualification & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${formId}-qual`} className="block text-xs font-bold text-slate-700 mb-1">Academic Qualification</label>
              <select
                id={`${formId}-qual`}
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
              <label htmlFor={`${formId}-exp`} className="block text-xs font-bold text-slate-700 mb-1">Professional Experience</label>
              <select
                id={`${formId}-exp`}
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

          {/* Motivation textarea */}
          <div>
            <label htmlFor={`${formId}-motivation`} className="block text-xs font-bold text-slate-700 mb-1">Professional Motivation (Optional)</label>
            <textarea
              id={`${formId}-motivation`}
              rows={2}
              placeholder="Briefly state your objective for enrolling..."
              value={motivation}
              onChange={(e) => handleChange('motivation', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 px-6 rounded-xl font-black text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                isFormValid
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white opacity-90'
              }`}
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
