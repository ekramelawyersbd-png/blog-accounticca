import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Lock,
  ExternalLink,
  Search,
  RefreshCw,
  LogOut,
  FileText,
  Video,
  Award
} from 'lucide-react';
import {
  TrainingAdmissionRecord,
  fetchTrainingAdmissionsFromFirestore,
} from '../services/trainingAdmissionFirestoreService';
import { useAuth } from '../contexts/AuthContext';
import { useShopAuth } from '../contexts/ShopAuthContext';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { adminUser } = useShopAuth();
  const navigate = useNavigate();

  const [admissions, setAdmissions] = useState<TrainingAdmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<string>(
    user?.email || adminUser?.email || 'ekram.elawyersbd@gmail.com'
  );
  const [emailInput, setEmailInput] = useState<string>(selectedEmail);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const loadAdmissions = async () => {
    setLoading(true);
    try {
      const data = await fetchTrainingAdmissionsFromFirestore();
      setAdmissions(data);
    } catch (err) {
      console.warn('Failed to load student admissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAdmissions();
  }, []);

  useEffect(() => {
    if (user?.email) {
      setSelectedEmail(user.email);
      setEmailInput(user.email);
    } else if (adminUser?.email) {
      setSelectedEmail(adminUser.email);
      setEmailInput(adminUser.email);
    }
  }, [user?.email, adminUser?.email]);

  const userAdmissions = useMemo(() => {
    return admissions.filter(
      (a) => a.email.toLowerCase() === selectedEmail.toLowerCase()
    );
  }, [admissions, selectedEmail]);

  const approvedAdmissions = useMemo(() => {
    return userAdmissions.filter((a) => a.status === 'approved');
  }, [userAdmissions]);

  const pendingAdmissions = useMemo(() => {
    return userAdmissions.filter((a) => a.status === 'pending');
  }, [userAdmissions]);

  // Sample course materials map for view-only student portal
  const courseMaterials: Record<string, { title: string; category: string; description: string; modules: { title: string; duration: string; type: string }[] }> = {
    'course-400': {
      title: 'Practical Income Tax & VAT Management',
      category: 'Tax & Compliance',
      description: 'Comprehensive curriculum on Bangladesh Income Tax Act 2023, VAT & SD Act 2012, e-TIN, return filing, and withholding tax compliance.',
      modules: [
        { title: 'Module 1: Overview of Income Tax Act 2023 & Slabs', duration: '45 mins', type: 'Video Lecture' },
        { title: 'Module 2: Salary Tax Computation & Section 86 Rebate', duration: '60 mins', type: 'Case Study' },
        { title: 'Module 3: Business Income & Allowable Deductions', duration: '50 mins', type: 'Reading Material' },
        { title: 'Module 4: VAT Return Submission (Mushak 9.1) & VDS', duration: '55 mins', type: 'Interactive Guide' },
      ],
    },
    'course-401': {
      title: 'Company Secretarial Practice & RJSC Compliance',
      category: 'Corporate Law',
      description: 'Mastering incorporation, share transfers, annual returns, board meetings, and RJSC filings under the Companies Act 1994.',
      modules: [
        { title: 'Module 1: Incorporation Workflow & Memorandum of Association', duration: '50 mins', type: 'Video Lecture' },
        { title: 'Module 2: Board Meetings, Resolutions & Statutory Registers', duration: '40 mins', type: 'Template Vault' },
        { title: 'Module 3: Share Capital Increase & Transfer Procedures', duration: '45 mins', type: 'Case Study' },
      ],
    },
    'course-402': {
      title: 'Labour Law & Employment Dispute Resolution',
      category: 'Labour Law',
      description: 'In-depth study of Bangladesh Labour Act 2006, employment contracts, termination, gratuity, and Labour Court proceedings.',
      modules: [
        { title: 'Module 1: Employment Contracts & Mandatory Provisions', duration: '45 mins', type: 'Video Lecture' },
        { title: 'Module 2: Gratuity, Provident Fund & Severance Rules', duration: '60 mins', type: 'Statutory Guide' },
      ],
    },
  };

  const defaultCourseMaterial = {
    title: 'Certified Statutory Compliance Practitioner Program',
    category: 'Advanced Compliance',
    description: 'Specialized view-only curriculum covering corporate governance, NBR audits, tax returns, and legal advisory.',
    modules: [
      { title: 'Orientation & Statutory Framework Overview', duration: '30 mins', type: 'Video Lecture' },
      { title: 'Core Compliance Checklist & Documentation', duration: '45 mins', type: 'Reading Material' },
      { title: 'Advanced Dispute Resolution Strategies', duration: '60 mins', type: 'Case Study' },
    ],
  };

  const activeCourseData = selectedCourseId
    ? courseMaterials[selectedCourseId] || defaultCourseMaterial
    : approvedAdmissions[0]
      ? courseMaterials[approvedAdmissions[0].courseId] || defaultCourseMaterial
      : defaultCourseMaterial;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      {/* Top Header */}
      <header className="bg-slate-950 text-white border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold inline-block">
                Student Portal · View-Only Access
              </div>
              <h1 className="text-lg font-black tracking-tight text-white mt-0.5">
                Academy Student Dashboard
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/training"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
            >
              Training Hub &amp; Courses
            </Link>
            <Link
              to="/"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Email Switcher & Status Banner */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <h2 className="text-xl font-black text-slate-900">
              Welcome back, {user?.displayName || adminUser?.name || selectedEmail.split('@')[0]}!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Your student dashboard displays approved courses based on your training admission application status. Courses with approved admissions grant view-only access to video lectures, reading materials, and case studies.
            </p>
          </div>

          {/* Email Selector */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 w-full lg:w-auto space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Simulate Student Email Account
            </label>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 w-60"
              />
              <button
                type="button"
                onClick={() => setSelectedEmail(emailInput.trim().toLowerCase())}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Switch
              </button>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Active: <strong className="text-slate-700">{selectedEmail}</strong>
            </div>
          </div>
        </div>

        {/* Admissions Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Approved Enrollments */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900">Approved Course Enrollments</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {approvedAdmissions.length} Enrolled
              </span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500 font-bold">Loading admissions...</div>
            ) : approvedAdmissions.length === 0 ? (
              <div className="py-8 text-center space-y-2 bg-slate-50 rounded-2xl border border-slate-100 p-4">
                <Lock className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-xs font-bold text-slate-800">No approved course enrollments found for this email</h4>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Visit the Training Hub, select a course, and submit an admission application to request view-only student access.
                </p>
                <Link
                  to="/training"
                  className="inline-block mt-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-emerald-500 transition"
                >
                  Explore Training Courses
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {approvedAdmissions.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedCourseId(item.courseId)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      selectedCourseId === item.courseId || (!selectedCourseId && approvedAdmissions[0]?.id === item.id)
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {item.courseId}
                        </span>
                        <span className="text-[10px] text-slate-500">Approved: {new Date(item.approvedAt || item.appliedAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-xs font-black text-slate-900">{item.courseName}</h4>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shrink-0">
                      View Portal
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Applications */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-black text-slate-900">Pending Admission Applications</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {pendingAdmissions.length} Pending
              </span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500 font-bold">Loading applications...</div>
            ) : pendingAdmissions.length === 0 ? (
              <div className="py-8 text-center space-y-2 bg-slate-50 rounded-2xl border border-slate-100 p-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="text-xs font-bold text-slate-800">No pending admission applications</h4>
                <p className="text-[11px] text-slate-500">All submitted applications have been reviewed or none have been filed yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingAdmissions.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        Application Ref: {item.id}
                      </span>
                      <span className="text-[10px] font-bold text-amber-700">Awaiting Admin Approval</span>
                    </div>
                    <h4 className="text-xs font-black text-slate-900">{item.courseName}</h4>
                    <p className="text-[11px] text-slate-600">Applied on {new Date(item.appliedAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* View-Only Course Portal Content */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-slate-900 text-white p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded bg-blue-500/20 text-cyan-300 font-bold">
                {activeCourseData.category} · View-Only Student Material
              </span>
              <h3 className="text-xl sm:text-2xl font-black">{activeCourseData.title}</h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">{activeCourseData.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
                Access Granted (Student View)
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Enrolled Curriculum &amp; Modules
            </h4>

            <div className="grid grid-cols-1 gap-4">
              {activeCourseData.modules.map((mod, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-black flex items-center justify-center shrink-0 border border-blue-200">
                      {idx + 1}
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-sm font-bold text-slate-900">{mod.title}</h5>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          <Clock className="w-3.5 h-3.5" /> {mod.duration}
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                          <FileText className="w-3.5 h-3.5" /> {mod.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => alert(`Opening student view-only module: "${mod.title}"`)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer shrink-0"
                  >
                    <Video className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Access Material (View-Only)</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
