import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ServiceSEO } from '../components/SEO';
import {
  Briefcase,
  Headphones,
  Users,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Clock,
  Building2,
  GraduationCap,
  Sparkles,
  FileText,
  Search,
  Mail,
  Phone,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  Laptop,
  Check,
  ExternalLink,
  DollarSign,
  ChevronDown,
  TrendingUp,
  Target
} from 'lucide-react';
import { queryLocalCareerApplications } from '../utils/careerStorage';

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: 'Can fresh graduates apply for these positions?',
    a: 'Yes, absolutely! For both the Accountant and Customer Care Executive positions, highly motivated fresh graduates are strongly encouraged to apply. For Accountants, candidates with BBA/B.Com in Accounting/Finance or prior internship/trainee experience are preferred. For Customer Care Executives, candidates with minimum HSC or Bachelor degrees in any discipline and strong communication skills are welcome.'
  },
  {
    q: 'Can I apply for both Accountant and Customer Care Executive positions?',
    a: 'Yes. If you meet the qualifications for both roles, you may submit separate applications for each position. You will receive an independent Reference ID for each application so you can track your status separately.'
  },
  {
    q: 'Is there any application fee or processing charge?',
    a: 'No. E-Lawyers Legal & Business Consultancy Firm never charges any application fee, registration fee, or security deposit at any stage of the recruitment process. All applications submitted through our official portal are 100% free of charge.'
  },
  {
    q: 'Where is the job location and what are the working hours?',
    a: 'Both positions are full-time, in-person roles based at our central corporate office located at BTI Centara Grand, Panthapath, Green Road, Dhaka, Bangladesh. Standard office hours are Sunday through Thursday, 9:30 AM to 6:30 PM (with Saturday rotas as mutually agreed).'
  },
  {
    q: 'How will I know if my application was successfully received?',
    a: 'Upon submitting your application form online, you will instantly receive a unique Reference ID (e.g., ELAW-ACC-2026-XXXX or ELAW-CCE-2026-XXXX) on the screen along with an automated confirmation receipt. You can check your application status anytime using our self-service status desk on this page.'
  },
  {
    q: 'What is the selection and interview timeline?',
    a: 'Our HR & Management review applications on a rolling basis until October 31, 2026. Shortlisted candidates are invited for an in-person assessment and interview at our Panthapath office within 5 to 7 business days of submission.'
  }
];

export const CareersHubPage: React.FC = () => {
  const [selectedRoleTab, setSelectedRoleTab] = useState<'both' | 'accountant' | 'customercare' | 'mto' | 'sales'>('both');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Status lookup state
  const [refIdInput, setRefIdInput] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<{
    found: boolean;
    referenceId?: string;
    candidateName?: string;
    position?: string;
    department?: string;
    status?: string;
    submittedAt?: string;
    message?: string;
  } | null>(null);

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = refIdInput.trim();
    if (!query) return;

    setStatusLoading(true);
    setStatusResult(null);

    try {
      const localMatches = queryLocalCareerApplications({ refId: query, email: query });

      let serverMatch: any = null;
      try {
        const res = await fetch(`/api/careers/applications?refId=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data && data.success && Array.isArray(data.applications) && data.applications.length > 0) {
          serverMatch = data.applications[0];
        } else {
          const resEmail = await fetch(`/api/careers/applications?email=${encodeURIComponent(query)}`);
          const dataEmail = await resEmail.json();
          if (dataEmail && dataEmail.success && Array.isArray(dataEmail.applications) && dataEmail.applications.length > 0) {
            serverMatch = dataEmail.applications[0];
          }
        }
      } catch {
        // Fallback to local match if server is unreachable
      }

      const app = serverMatch || localMatches[0];
      if (app) {
        setStatusResult({
          found: true,
          referenceId: app.referenceId,
          candidateName: app.candidateName,
          position: app.position || 'Applicant',
          department: app.department || 'General',
          status: app.status || 'Received',
          submittedAt: app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'Recently'
        });
      } else {
        setStatusResult({
          found: false,
          message: `No record found with Reference ID or Email "${query}". Please double-check your Reference ID (e.g. ELAW-SME-..., ELAW-MTO-..., ELAW-ACC-..., or ELAW-CCE-...).`
        });
      }
    } finally {
      setStatusLoading(false);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#f3f6f9] text-[#243446] font-sans pb-24">
      <ServiceSEO
        title="Careers & Current Openings | E-Lawyers Legal & Business Consultancy Firm"
        description="Join E-Lawyers Legal & Business Consultancy Firm in Panthapath, Dhaka. Explore career opportunities and apply online for Management Trainee Officer (MTO), Accountant (Accounts Division), and Customer Care Executive (Female). Deadline: Oct 31, 2026."
        canonicalUrl="/Careers"
        serviceType="Job Recruitment & Career Opportunities"
      />

      {/* Hero Header - Enhanced Light Official E-Lawyers WE'RE HIRING Master Banner Theme */}
      <section className="bg-gradient-to-br from-white via-[#fdfaf3] to-emerald-50/50 text-slate-900 pt-8 sm:pt-12 pb-24 sm:pb-28 px-4 border-b border-slate-200/90 relative z-10 overflow-hidden">
        {/* Ambient light background glows matching banner color palette */}
        <div className="absolute top-0 right-0 w-[520px] h-[520px] bg-amber-300/20 rounded-full blur-3xl pointer-events-none -mr-28 -mt-28"></div>
        <div className="absolute bottom-0 left-0 w-[520px] h-[520px] bg-emerald-300/20 rounded-full blur-3xl pointer-events-none -ml-28 -mb-28"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-[50px] relative z-10">
          {/* Top Brand & WhatsApp Hotline Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-5 border-b border-slate-200/90">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white border-2 border-[#c7a76b]/60 flex items-center justify-center font-black text-[#10243a] text-lg shadow-sm ring-4 ring-amber-500/10">
                ELA
              </div>
              <div>
                <span className="text-xs font-black tracking-widest text-[#10243a] uppercase block">
                  E-Lawyers Legal &amp; Business Consultancy Firm
                </span>
                <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  BTI Centara Grand, Panthapath, Dhaka · Central Recruitment Portal
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* WhatsApp Hotline Pill from Banner */}
              <a
                href="https://wa.me/8801335230170?text=Hello%20E-Lawyers%2C%20I%20am%20inquiring%20about%20the%202026%20recruitment%20drive."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs font-bold transition-all shadow-2xs group"
                title="Direct WhatsApp Helpline: +88 01335230170-81"
              >
                <div className="w-4 h-4 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Phone className="w-2.5 h-2.5 fill-current" />
                </div>
                <span className="tracking-wide font-mono font-bold">+88 01335230170-81</span>
              </a>

              <span className="inline-flex items-center gap-2 text-xs text-emerald-900 bg-white border border-emerald-300 px-3.5 py-1.5 rounded-full font-bold shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active Recruitment · 4 Career Tracks</span>
              </span>
            </div>
          </div>

          {/* Hero Headline & Recruitment Overview */}
          <div className="mb-9 text-center max-w-3xl mx-auto space-y-3.5">
            <div className="inline-flex items-center gap-2 bg-amber-50/90 px-4 py-1.5 rounded-full border border-amber-300/80 text-xs font-extrabold text-amber-900 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Official 2026 Recruitment Circular · Deadline: 31 October 2026</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#10243a] leading-tight">
              Build Your Career with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9e7a33] via-emerald-700 to-[#167d83]">
                E-Lawyers
              </span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
              Join our Accounts, Taxation, Corporate Legal &amp; Client Services divisions at BTI Centara Grand, Panthapath, Dhaka. Select your track below to view requirements or apply online.
            </p>
          </div>

          {/* Interactive Role Action Grid - Direct 1-Click Pathways to Official Forms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: MTO */}
            <Link
              to="/Careers/mto?tab=apply"
              className="p-5 rounded-2xl bg-white hover:bg-amber-50/40 border-2 border-slate-200/90 hover:border-amber-400 text-slate-900 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shadow-2xs">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                    Multiple Vacancies
                  </span>
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#10243a] group-hover:text-amber-800 transition-colors leading-snug">
                    MANAGEMENT TRAINEE OFFICER (MTO)
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Bachelor&apos;s in Accounting, Finance, BBA, Management or Law.
                  </p>
                </div>
              </div>
              <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-amber-800 group-hover:text-amber-900">
                <span>Apply Online</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 2: Sales & Marketing */}
            <Link
              to="/Careers/sales-marketing?tab=apply"
              className="p-5 rounded-2xl bg-white hover:bg-emerald-50/40 border-2 border-slate-200/90 hover:border-emerald-500 text-slate-900 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-2xs">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200">
                    Multiple Vacancies
                  </span>
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#10243a] group-hover:text-emerald-800 transition-colors leading-snug">
                    SALES &amp; MARKETING EXECUTIVE
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Bachelor&apos;s Degree · Attractive Salary + Performance Incentives.
                  </p>
                </div>
              </div>
              <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-emerald-700 group-hover:text-emerald-900">
                <span>Apply Online</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 3: Accountant */}
            <Link
              to="/Careers/accountant?tab=apply"
              className="p-5 rounded-2xl bg-white hover:bg-teal-50/40 border-2 border-slate-200/90 hover:border-[#167d83] text-slate-900 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#167d83] flex items-center justify-center shadow-2xs">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-900 border border-teal-200">
                    2 Vacancies
                  </span>
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#10243a] group-hover:text-[#167d83] transition-colors leading-snug">
                    ACCOUNTANT
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Accounting, Finance or Related Degree · Corporate Accounts.
                  </p>
                </div>
              </div>
              <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-[#167d83] group-hover:text-teal-900">
                <span>Apply Online</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 4: Customer Care */}
            <Link
              to="/Careers/customer-care?tab=apply"
              className="p-5 rounded-2xl bg-white hover:bg-amber-50/40 border-2 border-slate-200/90 hover:border-[#c7a76b] text-slate-900 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center shadow-2xs">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                    2 Vacancies · Female
                  </span>
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#10243a] group-hover:text-amber-800 transition-colors leading-snug">
                    CUSTOMER CARE EXECUTIVE
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    HSC or Above · Freshers Welcome · Excellent Communication.
                  </p>
                </div>
              </div>
              <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-amber-800 group-hover:text-amber-950">
                <span>Apply Online</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>

          {/* Banner Verification & Contact Information Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-7 pt-5 border-t border-slate-200/90">
            <div className="bg-white/90 border border-slate-200/90 rounded-xl p-3 text-center shadow-2xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Application Deadline</span>
              <span className="text-xs sm:text-sm font-black text-amber-700 mt-0.5 block">31 October 2026</span>
            </div>

            <div className="bg-white/90 border border-slate-200/90 rounded-xl p-3 text-center shadow-2xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Official Portal</span>
              <span className="text-xs sm:text-sm font-black text-emerald-700 mt-0.5 block">blog.accounticca.com/Careers</span>
            </div>

            <div className="bg-white/90 border border-slate-200/90 rounded-xl p-3 text-center shadow-2xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Direct WhatsApp Helpline</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-[#10243a] mt-0.5 block">+88 01335230170-81</span>
            </div>

            <div className="bg-white/90 border border-slate-200/90 rounded-xl p-3 text-center shadow-2xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Social Network</span>
              <span className="text-xs sm:text-sm font-bold text-[#167d83] mt-0.5 block">/eLawyerssBD</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <div className="w-full max-w-6xl mx-auto px-4 -mt-8 sm:-mt-10 space-y-12 relative z-20">

        {/* Unified Application Navigator Banner - Moved Forward with Elevated Depth */}
        <div className="bg-white rounded-3xl shadow-xl hover:shadow-2xl border-2 border-slate-200/90 p-5 md:p-7 relative z-30 transition-all duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#167d83] bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200/60 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#167d83]" />
                Central Navigation Hub · Fast Track
              </div>
              <h2 className="text-xl md:text-2xl font-black text-[#10243a] mt-0.5 tracking-tight">
                Current Open Opportunities &amp; Direct Application Forms
              </h2>
              <p className="text-xs md:text-sm text-slate-600 mt-1">
                Select your preferred track below to view role requirements or move forward directly to the official 8-step application form.
              </p>
            </div>

            {/* Role Filter Buttons */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs self-start md:self-auto flex-wrap">
              <button
                onClick={() => setSelectedRoleTab('both')}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  selectedRoleTab === 'both'
                    ? 'bg-[#10243a] text-white shadow-sm scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                All Roles (4)
              </button>
              <button
                onClick={() => setSelectedRoleTab('mto')}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedRoleTab === 'mto'
                    ? 'bg-[#10243a] text-amber-300 shadow-sm scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>MTO Trainee</span>
              </button>
              <button
                onClick={() => setSelectedRoleTab('sales')}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedRoleTab === 'sales'
                    ? 'bg-emerald-700 text-white shadow-sm scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
                <span>Sales &amp; Marketing</span>
              </button>
              <button
                onClick={() => setSelectedRoleTab('accountant')}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedRoleTab === 'accountant'
                    ? 'bg-[#167d83] text-white shadow-sm scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Accountant</span>
              </button>
              <button
                onClick={() => setSelectedRoleTab('customercare')}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedRoleTab === 'customercare'
                    ? 'bg-[#c7a76b] text-[#10243a] shadow-sm scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Customer Care</span>
              </button>
            </div>
          </div>

          {/* Quick Direct Link Row - Forward Progression Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-5">
            <Link
              to="/Careers/mto?tab=apply"
              className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/90 via-slate-50 to-white hover:to-amber-50 border-2 border-amber-300/80 hover:border-amber-400 transition-all duration-300 ease-out shadow-xs hover:shadow-lg hover:shadow-amber-900/10 flex items-center justify-between group hover:-translate-y-1 hover:scale-[1.015] will-change-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10243a] to-[#1c3c5d] text-amber-300 flex items-center justify-center font-bold shadow-xs group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                      Step 1 of 8
                    </span>
                    <span className="text-[11px] text-amber-900 font-bold uppercase tracking-wider">MTO Batch</span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-[#10243a] group-hover:text-amber-800 transition-colors mt-0.5">
                    MTO Trainee (অনলাইন আবেদন)
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-800 group-hover:translate-x-1.5 transition-transform duration-300 flex-shrink-0" />
            </Link>

            <Link
              to="/Careers/sales-marketing?tab=apply"
              className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-slate-50 to-white hover:to-emerald-50 border-2 border-emerald-300/80 hover:border-emerald-400 transition-all duration-300 ease-out shadow-xs hover:shadow-lg hover:shadow-emerald-900/10 flex items-center justify-between group hover:-translate-y-1 hover:scale-[1.015] will-change-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-900 text-white flex items-center justify-center font-bold shadow-xs group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                  <TrendingUp className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded">
                      Step 1 of 8
                    </span>
                    <span className="text-[11px] text-emerald-900 font-bold uppercase tracking-wider">Growth</span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-[#10243a] group-hover:text-emerald-800 transition-colors mt-0.5">
                    Sales &amp; Marketing Executive
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-800 group-hover:translate-x-1.5 transition-transform duration-300 flex-shrink-0" />
            </Link>

            <Link
              to="/Careers/accountant?tab=apply"
              className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-50/90 via-slate-50 to-white hover:to-teal-50 border-2 border-teal-200/90 hover:border-teal-400 transition-all duration-300 ease-out shadow-xs hover:shadow-lg hover:shadow-teal-900/10 flex items-center justify-between group hover:-translate-y-1 hover:scale-[1.015] will-change-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#167d83] to-[#0c4e52] text-white flex items-center justify-center font-bold shadow-xs group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Briefcase className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-teal-800 bg-teal-100/80 px-1.5 py-0.5 rounded">
                      Step 1 of 8
                    </span>
                    <span className="text-[11px] text-teal-900 font-bold uppercase tracking-wider">Fast-Track</span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-[#10243a] group-hover:text-[#167d83] transition-colors mt-0.5">
                    Apply as Accountant (হিসাবরক্ষক)
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-teal-700 group-hover:translate-x-1.5 transition-transform duration-300 flex-shrink-0" />
            </Link>

            <Link
              to="/Careers/customer-care?tab=apply"
              className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/90 via-slate-50 to-white hover:to-amber-50 border-2 border-amber-200/90 hover:border-amber-400 transition-all duration-300 ease-out shadow-xs hover:shadow-lg hover:shadow-amber-900/10 flex items-center justify-between group hover:-translate-y-1 hover:scale-[1.015] will-change-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c7a76b] to-[#9e7a33] text-[#10243a] flex items-center justify-center font-bold shadow-xs group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                  <Headphones className="w-5 h-5 text-amber-950" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-100/90 px-1.5 py-0.5 rounded">
                      Step 1 of 8
                    </span>
                    <span className="text-[11px] text-amber-900 font-bold uppercase tracking-wider">Customer Care</span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-[#10243a] group-hover:text-amber-800 transition-colors mt-0.5">
                    Apply as Customer Care (নারী কর্মী)
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-900 group-hover:translate-x-1.5 transition-transform duration-300 flex-shrink-0" />
            </Link>
          </div>
        </div>

        {/* Detailed Open Positions Showcase - Responsive Grid Layout */}
        <div className={`grid gap-8 items-stretch ${
          selectedRoleTab === 'both' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-3xl mx-auto w-full'
        }`}>
          {/* Card 1: Accountant */}
          {(selectedRoleTab === 'both' || selectedRoleTab === 'accountant') && (
            <div className="bg-white rounded-3xl border-2 border-slate-200/90 hover:border-[#167d83] transition-all duration-300 ease-out shadow-md hover:shadow-[0_24px_48px_-12px_rgba(22,125,131,0.22)] hover:-translate-y-1.5 hover:scale-[1.01] will-change-transform flex flex-col justify-between overflow-hidden group">
              <div>
                {/* Header Section with Deep Navy-Teal Gradient & Gold Trim */}
                <div className="bg-gradient-to-br from-[#091b2c] via-[#102d45] to-[#167d83] p-6 sm:p-7 text-white border-b-4 border-[#c7a76b] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-44 h-44 bg-teal-400/15 group-hover:bg-teal-300/25 group-hover:scale-125 transition-all duration-500 rounded-full blur-2xl pointer-events-none -mr-12 -mt-12"></div>
                  <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-amber-400/10 group-hover:bg-amber-300/20 group-hover:scale-110 transition-all duration-500 rounded-full blur-xl pointer-events-none"></div>
                  
                  {/* Top Badges Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 relative z-10">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#ddc38f] bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 shadow-xs">
                      <Briefcase className="w-3.5 h-3.5 text-[#ddc38f]" />
                      Accounts Division (B2B Services)
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/80 px-3.5 py-1.5 rounded-full border border-emerald-400/50 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      ২ জন · Full-Time · Urgent Hiring
                    </span>
                  </div>

                  {/* Job Title & Nature */}
                  <div className="space-y-1.5 relative z-10">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight group-hover:text-teal-100 transition-colors">
                        Accountant
                      </h3>
                      <span className="text-xs sm:text-sm font-bold text-[#ddc38f] bg-black/30 border border-[#c7a76b]/40 px-3 py-1 rounded-lg backdrop-blur-xs">
                        হিসাবরক্ষক
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 font-medium leading-snug">
                      Voucher Posting, Double-Entry General Ledger, Bank Reconciliation &amp; Statutory Tax/VAT Compliance (ITA 2023)
                    </p>
                  </div>
                </div>

                {/* 4-Tile Quick Specs Matrix */}
                <div className="grid grid-cols-2 gap-2.5 p-5 bg-slate-50/90 border-b border-slate-200">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-teal-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <GraduationCap className="w-3.5 h-3.5 text-[#167d83]" />
                      <span>Education</span>
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-[#10243a] leading-tight">
                      BBA / B.Com / M.Com
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Accounting or Finance Major</div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-teal-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <Users className="w-3.5 h-3.5 text-[#167d83]" />
                      <span>Experience</span>
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-emerald-700 leading-tight">
                      Freshers Welcome (0–2 Yrs)
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Internship / trainee exp. valued</div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-teal-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <DollarSign className="w-3.5 h-3.5 text-[#167d83]" />
                      <span>Remuneration</span>
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-emerald-700 leading-tight">
                      BDT 25,000 – 30,000
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">+ 2 Festival Bonuses &amp; Medical</div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-teal-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <MapPin className="w-3.5 h-3.5 text-[#167d83]" />
                      <span>Workplace</span>
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-[#10243a] leading-tight">
                      Panthapath, Dhaka
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">In-Person Corporate Office</div>
                  </div>
                </div>

                {/* Card Body & Responsibilities */}
                <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-700">
                  <p className="text-slate-600 leading-relaxed">
                    E-Lawyers is expanding its professional Accounts Division to handle corporate bookkeeping, double-entry voucher posting, monthly bank reconciliations, audit trail preparations, and statutory Tax/VAT compliance under the Income Tax Act 2023.
                  </p>

                  {/* Key Tasks List */}
                  <div className="space-y-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                    <div className="font-extrabold text-[#10243a] text-xs uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Key Daily Responsibilities:</span>
                      <span className="text-[10px] text-teal-800 font-bold bg-teal-100 px-2 py-0.5 rounded">Core Tasks</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-700">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>Daily voucher posting, journal entry, debit/credit verification, and general ledger maintenance in accounting software</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>Monthly bank reconciliations, accounts payable/receivable ledgers, and cash flow statement preparation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>TDS &amp; VDS withholding calculation schedules and VAT-9.1 return working paper documentation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>Assisting senior advocates and tax advisors with year-end trial balance and statutory corporate tax return filings</span>
                      </li>
                    </ul>
                  </div>

                  {/* Essential Tool Badges */}
                  <div>
                    <div className="text-xs font-bold text-slate-800 mb-2">Required Tools &amp; Competencies:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {['MS Excel (VLOOKUP & Pivot)', 'Tally Prime / QuickBooks', 'Double-Entry Bookkeeping', 'TDS / VDS Compliance', 'Income Tax Act 2023', 'Bank Reconciliation', 'Trial Balance'].map((tool, idx) => (
                        <span key={idx} className="text-[11px] bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 px-2.5 py-1 rounded-md font-medium transition-colors">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Official Role Recruitment Announcement Card Preview (Symmetrical with Card 2) */}
                  <div className="pt-1">
                    <Link
                      to="/Careers/accountant"
                      className="block relative rounded-2xl overflow-hidden border-2 border-teal-600/30 hover:border-teal-500 shadow-sm hover:shadow-lg transition-all group/banner bg-gradient-to-br from-[#0c1f33] via-[#112d47] to-[#15465a] p-5 text-white"
                      title="View Official Accountant Recruitment Notice &amp; Syllabus"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#ddc38f] font-black text-xs shadow-inner">
                            ELA
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-teal-300">Official Notice</div>
                            <div className="text-xs font-extrabold text-white">E-Lawyers Legal &amp; Business Consultancy</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono bg-black/40 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded">
                          Ref: EL/HR-ACC/2026
                        </span>
                      </div>

                      <div className="space-y-1 mb-3">
                        <div className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                          <span>Accountant (হিসাবরক্ষক)</span>
                          <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-400/30">
                            ২ টি পদ
                          </span>
                        </div>
                        <div className="text-xs text-slate-300">
                          BBA/B.Com Major in Accounting/Finance · BDT 25,000–30,000 · Panthapath Office
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-200 bg-white/5 border border-white/10 rounded-xl p-2.5 mb-2">
                        <div><strong className="text-white">Status:</strong> Full-Time (In-Person)</div>
                        <div><strong className="text-white">Mentorship:</strong> ITA 2023 CA/Advocate</div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs font-bold text-teal-200 group-hover/banner:text-white transition-colors">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          View Complete Job Circular, Syllabus &amp; Exam Scheme
                        </span>
                        <ChevronRight className="w-4 h-4 text-teal-300 group-hover/banner:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  </div>

                  {/* Balanced Mentorship Box for Accountant */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-teal-50/90 via-slate-50 to-emerald-50/90 border border-teal-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#167d83] text-white flex items-center justify-center font-black text-xs shadow-xs">
                        ITA
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#10243a]">Structured Professional Mentorship</div>
                        <div className="text-[11px] text-slate-600">Direct guidance by Senior Advocates &amp; Chartered Accountants</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-teal-800 bg-white px-2.5 py-1 rounded-md border border-teal-200 whitespace-nowrap shadow-2xs">
                      2 Openings
                    </span>
                  </div>
                </div>
              </div>

              {/* High-Impact Call-To-Action (CTA) Dock */}
              <div className="p-6 bg-slate-50/90 border-t border-slate-200 space-y-3 mt-auto">
                <Link
                  to="/Careers/accountant?tab=apply"
                  className="w-full py-4 px-5 bg-gradient-to-r from-[#167d83] via-[#126b70] to-[#0c4e52] hover:from-[#198d94] hover:to-[#106267] text-white font-black text-sm sm:text-base rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group-hover:scale-[1.01] border border-teal-300/30"
                >
                  <FileText className="w-5 h-5 text-emerald-300" />
                  <span>Apply Online — Accountant Form (অনলাইন আবেদন)</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <Link
                    to="/Careers/accountant"
                    className="flex-1 py-2 px-3 text-center text-xs font-bold text-[#10243a] bg-white hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 shadow-2xs"
                  >
                    View Job Circular (বিজ্ঞপ্তি ও সিলেবাস)
                  </Link>
                  <span className="text-[11px] text-slate-500 font-semibold bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 whitespace-nowrap">
                    Deadline: Oct 31, 2026
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Card 2: Customer Care Executive */}
          {(selectedRoleTab === 'both' || selectedRoleTab === 'customercare') && (
            <div className="bg-white rounded-3xl border-2 border-slate-200/90 hover:border-[#c7a76b] transition-all duration-300 ease-out shadow-md hover:shadow-[0_24px_48px_-12px_rgba(199,167,107,0.28)] hover:-translate-y-1.5 hover:scale-[1.01] will-change-transform flex flex-col justify-between overflow-hidden group">
              <div>
                {/* Header Section with Deep Navy-Amber Gradient & Gold Trim */}
                <div className="bg-gradient-to-br from-[#122438] via-[#1a3854] to-[#1a6670] p-6 sm:p-7 text-white border-b-4 border-amber-400 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-amber-400/15 group-hover:bg-amber-300/25 group-hover:scale-125 transition-all duration-500 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10"></div>
                  
                  {/* Top Badges Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 relative z-10">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-amber-300 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
                      <Headphones className="w-3.5 h-3.5 text-amber-300" />
                      Customer Care / Call Center Desk
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/70 px-3 py-1 rounded-full border border-emerald-400/40 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      ২ জন (Female) · Full-Time
                    </span>
                  </div>

                  {/* Job Title & Nature */}
                  <div className="space-y-1 relative z-10">
                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-between group-hover:text-amber-100 transition-colors">
                      <span>Customer Care Executive</span>
                      <span className="text-xs sm:text-sm font-semibold text-amber-300 bg-black/20 px-2.5 py-1 rounded-lg">
                        Female
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-200 font-medium">
                      Client Communications, Inbound Support, Scheduling &amp; WhatsApp Desk
                    </p>
                  </div>
                </div>

                {/* 4-Tile Quick Specs Matrix */}
                <div className="grid grid-cols-2 gap-2.5 p-5 bg-slate-50/90 border-b border-slate-200">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-amber-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <GraduationCap className="w-3.5 h-3.5 text-[#167d83]" />
                      <span>Education</span>
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-[#10243a] leading-tight">
                      HSC / Graduate
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Any academic discipline</div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-amber-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <Users className="w-3.5 h-3.5 text-[#167d83]" />
                      <span>Experience</span>
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-emerald-700 leading-tight">
                      Freshers Welcome
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Call center exp. preferred</div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-amber-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <DollarSign className="w-3.5 h-3.5 text-[#167d83]" />
                      <span>Remuneration</span>
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-emerald-700 leading-tight">
                      Negotiable (Competitive)
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">+ 2 Festival Bonuses</div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-amber-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <MapPin className="w-3.5 h-3.5 text-[#167d83]" />
                      <span>Workplace</span>
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-[#10243a] leading-tight">
                      Panthapath, Dhaka
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Safe Corporate Office</div>
                  </div>
                </div>

                {/* Card Body & Responsibilities */}
                <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-700">
                  <p className="text-slate-600 leading-relaxed">
                    E-Lawyers is seeking 2 motivated Female Customer Care Executives to manage inbound client telephone calls, coordinate appointment slots with senior advocates and tax advisors, and maintain proactive communication on digital channels.
                  </p>

                  {/* Key Tasks List */}
                  <div className="space-y-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                    <div className="font-extrabold text-[#10243a] text-xs uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Key Daily Responsibilities:</span>
                      <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded">Client Care</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-700">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>Receiving inbound inquiries with polite telephone etiquette, active listening, and proper guidance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>Scheduling client consultations for advocates, company law attorneys, and tax specialists</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>Managing official WhatsApp Business inquiries, caller logs, and CRM record accuracy</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>Following up with prospective clients and ensuring a welcoming front-desk / virtual experience</span>
                      </li>
                    </ul>
                  </div>

                  {/* Essential Tool Badges */}
                  <div>
                    <div className="text-xs font-bold text-slate-800 mb-2">Required Tools &amp; Competencies:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {['Fluent Spoken Bengali', 'Conversational English', 'Telephone Etiquette', 'WhatsApp Business CRM', 'Active Listening', 'Client Appointment Scheduling'].map((tool, idx) => (
                        <span key={idx} className="text-[11px] bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 px-2.5 py-1 rounded-md font-medium transition-colors">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Official Role Recruitment Announcement Card Preview */}
                  <div className="pt-1">
                    <Link
                      to="/Careers/customer-care"
                      className="block relative rounded-2xl overflow-hidden border-2 border-amber-500/30 hover:border-amber-400 shadow-sm hover:shadow-lg transition-all group/banner bg-gradient-to-br from-[#122438] via-[#1a3854] to-[#1a6670] p-5 text-white"
                      title="View Official Customer Care Recruitment Notice"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 font-black text-xs shadow-inner">
                            ELA
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-300">Official Notice</div>
                            <div className="text-xs font-extrabold text-white">E-Lawyers Legal &amp; Business Consultancy</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono bg-black/40 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded">
                          Ref: EL/HR-CCE/2026
                        </span>
                      </div>

                      <div className="space-y-1 mb-3">
                        <div className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                          <span>Customer Care Executive (Female)</span>
                          <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-400/30">
                            ২ টি পদ
                          </span>
                        </div>
                        <div className="text-xs text-slate-300">
                          HSC / Graduate · Competitive Negotiable Salary · Panthapath Office
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-200 bg-white/5 border border-white/10 rounded-xl p-2.5 mb-2">
                        <div><strong className="text-white">Status:</strong> Full-Time (In-Person)</div>
                        <div><strong className="text-white">Environment:</strong> Safe &amp; Women-Friendly</div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs font-bold text-amber-200 group-hover/banner:text-white transition-colors">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          View Complete Job Circular &amp; Details
                        </span>
                        <ChevronRight className="w-4 h-4 text-amber-300 group-hover/banner:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  </div>

                  {/* Balanced Workplace Box for Customer Care */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50/90 via-slate-50 to-teal-50/90 border border-amber-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#c7a76b] text-[#10243a] flex items-center justify-center font-black text-xs shadow-xs">
                        CCE
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#10243a]">Dignified &amp; Women-Friendly Workplace</div>
                        <div className="text-[11px] text-slate-600">Supportive corporate environment in Panthapath, Dhaka</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-amber-900 bg-white px-2.5 py-1 rounded-md border border-amber-200 whitespace-nowrap shadow-2xs">
                      2 Openings
                    </span>
                  </div>
                </div>
              </div>

              {/* High-Impact Call-To-Action (CTA) Dock */}
              <div className="p-6 bg-slate-50/80 border-t border-slate-200 space-y-3 mt-auto">
                <Link
                  to="/Careers/customer-care?tab=apply"
                  className="w-full py-4 px-5 bg-gradient-to-r from-[#c7a76b] via-[#b89553] to-[#a07c39] hover:from-[#d5b67b] hover:to-[#b89553] text-[#10243a] font-black text-sm sm:text-base rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group-hover:scale-[1.01] border border-amber-300/40"
                >
                  <FileText className="w-5 h-5 text-[#10243a]" />
                  <span>Apply Online — Customer Care Form (অনলাইন আবেদন)</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <Link
                    to="/Careers/customer-care"
                    className="flex-1 py-2 px-3 text-center text-xs font-bold text-[#10243a] bg-white hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 shadow-2xs"
                  >
                    View Job Circular (সম্পূর্ণ বিজ্ঞপ্তি)
                  </Link>
                  <span className="text-[11px] text-slate-500 font-semibold bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 whitespace-nowrap">
                    Deadline: Oct 31, 2026
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Card 3: Management Trainee Officer (MTO) */}
          {(selectedRoleTab === 'both' || selectedRoleTab === 'mto') && (
            <div className="bg-white rounded-3xl border-2 border-slate-200/90 hover:border-amber-400 transition-all duration-300 ease-out shadow-md hover:shadow-[0_24px_48px_-12px_rgba(245,158,11,0.24)] hover:-translate-y-1.5 hover:scale-[1.01] will-change-transform flex flex-col justify-between overflow-hidden group">
              <div>
                {/* Header Section with Deep Navy-Gold Gradient & Gold Trim */}
                <div className="bg-gradient-to-br from-[#0b1726] via-[#10243a] to-[#1c3c5d] p-6 sm:p-7 text-white border-b-4 border-amber-400 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-44 h-44 bg-amber-400/15 group-hover:bg-amber-300/25 group-hover:scale-125 transition-all duration-500 rounded-full blur-2xl pointer-events-none -mr-12 -mt-12"></div>
                  <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-teal-400/10 group-hover:bg-teal-300/20 group-hover:scale-110 transition-all duration-500 rounded-full blur-xl pointer-events-none"></div>

                  {/* Top Badges Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 relative z-10">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#ddc38f] bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Accounts, Tax, Legal &amp; Consultancy
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-950/80 px-3.5 py-1.5 rounded-full border border-amber-400/50 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                      Multiple Openings · Full-Time
                    </span>
                  </div>

                  {/* Job Title & Nature */}
                  <div className="space-y-1.5 relative z-10">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight group-hover:text-amber-200 transition-colors">
                        Management Trainee (MTO)
                      </h3>
                      <span className="text-xs sm:text-sm font-bold text-[#ddc38f] bg-black/30 border border-[#c7a76b]/40 px-3 py-1 rounded-lg backdrop-blur-xs">
                        ম্যানেজমেন্ট ট্রেইনি
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 font-medium leading-snug">
                      Practical Rotational Development in Accounts, Tax Compliance, Legal Advisory &amp; Operations Management
                    </p>
                  </div>
                </div>

                {/* 4-Tile Quick Specs Matrix */}
                <div className="grid grid-cols-2 gap-2.5 p-5 bg-slate-50/90 border-b border-slate-200">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-amber-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <GraduationCap className="w-3.5 h-3.5 text-[#167d83]" />
                      <span>Education</span>
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-[#10243a] leading-tight">
                      BBA / LL.B / Accounting
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Finance, Law or Management</div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-amber-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <Users className="w-3.5 h-3.5 text-[#167d83]" />
                      <span>Experience</span>
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-emerald-700 leading-tight">
                      Fresh Graduates Welcome
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Entry-Level Trainee Program</div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-amber-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <DollarSign className="w-3.5 h-3.5 text-[#167d83]" />
                      <span>Remuneration</span>
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-emerald-700 leading-tight">
                      Negotiable Stipend
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">+ 2 Festival Bonuses &amp; Review</div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-amber-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <MapPin className="w-3.5 h-3.5 text-[#167d83]" />
                      <span>Workplace</span>
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-[#10243a] leading-tight">
                      Panthapath, Dhaka
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Corporate HQ Office</div>
                  </div>
                </div>

                {/* Card Body & Responsibilities */}
                <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-700">
                  <p className="text-slate-600 leading-relaxed">
                    As a Management Trainee Officer (MTO), you will receive direct on-the-job mentorship from Senior Advocates, Chartered Tax Advisors, and Corporate Consultants, rotating through accounts, tax filings, legal research, and client relationship management.
                  </p>

                  {/* Key Tasks List */}
                  <div className="space-y-2 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                    <div className="font-extrabold text-[#10243a] text-xs uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Core Rotational Responsibilities:</span>
                      <span className="text-[10px] text-teal-800 font-bold bg-teal-100 px-2 py-0.5 rounded">Multi-Track</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-700">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>Daily office operations, administrative coordination, and cross-departmental tasks</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>Supporting accounts documentation, financial record keeping, and tax compliance files</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>Assisting legal teams with contract drafting, research, and client communication</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>Participating in structured training sessions across RJSC, NBR Tax/VAT, and advisory workflows</span>
                      </li>
                    </ul>
                  </div>

                  {/* Essential Tool Badges */}
                  <div>
                    <div className="text-xs font-bold text-slate-800 mb-2">Required Competencies:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {['MS Word & Excel', 'Analytical Thinking', 'Problem Solving', 'Document Drafting', 'Client Communication', 'Integrity & Confidentiality'].map((tool, idx) => (
                        <span key={idx} className="text-[11px] bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 px-2.5 py-1 rounded-md font-medium transition-colors">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Official Role Recruitment Announcement Card Preview */}
                  <div className="pt-1">
                    <Link
                      to="/Careers/mto"
                      className="block relative rounded-2xl overflow-hidden border-2 border-amber-500/30 hover:border-amber-400 shadow-sm hover:shadow-lg transition-all group/banner bg-gradient-to-br from-[#0b1726] via-[#10243a] to-[#1c3c5d] p-5 text-white"
                      title="View Official MTO Recruitment Notice"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#ddc38f] font-black text-xs shadow-inner">
                            ELA
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-300">Official Notice</div>
                            <div className="text-xs font-extrabold text-white">E-Lawyers Legal &amp; Business Consultancy</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono bg-black/40 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded">
                          Ref: EL/HR-MTO/2026
                        </span>
                      </div>

                      <div className="space-y-1 mb-3">
                        <div className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                          <span>Management Trainee Officer (MTO)</span>
                          <span className="text-[11px] font-semibold text-amber-300 bg-amber-950/70 px-2 py-0.5 rounded border border-amber-400/30">
                            একাধিক পদ
                          </span>
                        </div>
                        <div className="text-xs text-slate-300">
                          BBA / LL.B / Accounting / Finance · Rotational Program · Panthapath Office
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-200 bg-white/5 border border-white/10 rounded-xl p-2.5 mb-2">
                        <div><strong className="text-white">Status:</strong> Full-Time (In-Person)</div>
                        <div><strong className="text-white">Track:</strong> Multi-Division Rotation</div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs font-bold text-amber-200 group-hover/banner:text-white transition-colors">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          View Complete Job Circular &amp; Details
                        </span>
                        <ChevronRight className="w-4 h-4 text-amber-300 group-hover/banner:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  </div>

                  {/* Mentorship Box */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50/90 via-slate-50 to-teal-50/90 border border-amber-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#10243a] text-amber-300 flex items-center justify-center font-black text-xs shadow-xs">
                        MTO
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#10243a]">Executive On-the-Job Training</div>
                        <div className="text-[11px] text-slate-600">Cross-departmental rotation &amp; leadership growth</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-amber-900 bg-white px-2.5 py-1 rounded-md border border-amber-200 whitespace-nowrap shadow-2xs">
                      Multiple Openings
                    </span>
                  </div>
                </div>
              </div>

              {/* High-Impact Call-To-Action (CTA) Dock */}
              <div className="p-6 bg-slate-50/90 border-t border-slate-200 space-y-3 mt-auto">
                <Link
                  to="/Careers/mto?tab=apply"
                  className="w-full py-4 px-5 bg-gradient-to-r from-[#10243a] via-[#1c3c5d] to-[#10243a] hover:from-[#193b61] hover:to-[#10243a] text-amber-300 font-black text-sm sm:text-base rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group-hover:scale-[1.01] border border-amber-300/40"
                >
                  <FileText className="w-5 h-5 text-amber-400" />
                  <span>Apply Online — MTO Form (অনলাইন আবেদন)</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <Link
                    to="/Careers/mto"
                    className="flex-1 py-2 px-3 text-center text-xs font-bold text-[#10243a] bg-white hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 shadow-2xs"
                  >
                    View Job Circular (সম্পূর্ণ বিজ্ঞপ্তি)
                  </Link>
                  <span className="text-[11px] text-slate-500 font-semibold bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 whitespace-nowrap">
                    Deadline: Oct 31, 2026
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Card 4: Sales & Marketing Executive */}
          {(selectedRoleTab === 'both' || selectedRoleTab === 'sales') && (
            <div className="bg-white rounded-3xl border-2 border-slate-200/90 hover:border-emerald-600 transition-all duration-300 ease-out shadow-md hover:shadow-[0_24px_48px_-12px_rgba(16,185,129,0.22)] hover:-translate-y-1.5 hover:scale-[1.01] will-change-transform flex flex-col justify-between overflow-hidden group">
              <div>
                {/* Header Section with Deep Emerald Gradient & Gold Trim */}
                <div className="bg-gradient-to-br from-[#0a231c] via-[#0f3d32] to-[#106b53] p-6 sm:p-7 text-white border-b-4 border-amber-400 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-400/15 group-hover:bg-emerald-300/25 group-hover:scale-125 transition-all duration-500 rounded-full blur-2xl pointer-events-none -mr-12 -mt-12"></div>
                  <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-amber-400/10 group-hover:bg-amber-300/20 group-hover:scale-110 transition-all duration-500 rounded-full blur-xl pointer-events-none"></div>

                  {/* Top Badges Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 relative z-10">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-emerald-200 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 shadow-xs">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
                      Sales &amp; Business Development
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-emerald-950/80 px-3.5 py-1.5 rounded-full border border-amber-400/50 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      একাধিক পদ · Full-Time / Part-Time
                    </span>
                  </div>

                  {/* Job Title & Nature */}
                  <div className="space-y-1.5 relative z-10">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight group-hover:text-emerald-100 transition-colors">
                        Sales &amp; Marketing Executive
                      </h3>
                      <span className="text-xs sm:text-sm font-bold text-amber-300 bg-black/30 border border-amber-400/40 px-3 py-1 rounded-lg backdrop-blur-xs">
                        মার্কেটিং
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 font-medium leading-snug">
                      Client Acquisition, Legal &amp; Tax Solutions Promotion, Corporate Outreach &amp; Account Management
                    </p>
                  </div>
                </div>

                {/* 4-Tile Quick Specs Matrix */}
                <div className="grid grid-cols-2 gap-2.5 p-5 bg-slate-50/90 border-b border-slate-200">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Education</span>
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-[#10243a] leading-tight">
                      BBA / Marketing / Any
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Management or any discipline</div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <Users className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Experience</span>
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-emerald-700 leading-tight">
                      Freshers Welcome
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Prior sales/telemarketing valued</div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Remuneration</span>
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-emerald-700 leading-tight">
                      Negotiable Base
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">+ Sales Commission &amp; Bonuses</div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Workplace</span>
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-[#10243a] leading-tight">
                      Panthapath, Dhaka
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">BTI Centara Grand Office</div>
                  </div>
                </div>

                {/* Card Body & Responsibilities */}
                <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-700">
                  <p className="text-slate-600 leading-relaxed">
                    Identify prospective clients, pitch E-Lawyers' suite of corporate legal, company registration (RJSC), taxation, accounting, and business advisory solutions, and build sustainable client relationships to drive firm growth.
                  </p>

                  {/* Key Tasks List */}
                  <div className="space-y-2 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                    <div className="font-extrabold text-[#10243a] text-xs uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Key Sales Responsibilities:</span>
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">Growth Engine</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-700">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>Generate new leads via corporate phone calls, email outreach, digital channels, and field networking</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>Understand client pain-points and coordinate with legal and tax departments to convert consultations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>Maintain CRM databases, follow-up logs, sales pipelines, and weekly conversion metrics</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>Present service proposals for RJSC incorporation, NBR tax compliance, and retainer packages</span>
                      </li>
                    </ul>
                  </div>

                  {/* Essential Tool Badges */}
                  <div>
                    <div className="text-xs font-bold text-slate-800 mb-2">Required Competencies:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {['Persuasion & Pitching', 'Corporate Outreach', 'Lead Generation', 'Client Relationship', 'Negotiation Skills', 'Target Drive'].map((tool, idx) => (
                        <span key={idx} className="text-[11px] bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 px-2.5 py-1 rounded-md font-medium transition-colors">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Official Role Recruitment Announcement Card Preview */}
                  <div className="pt-1">
                    <Link
                      to="/Careers/sales-marketing"
                      className="block relative rounded-2xl overflow-hidden border-2 border-emerald-500/30 hover:border-emerald-400 shadow-sm hover:shadow-lg transition-all group/banner bg-gradient-to-br from-[#0a231c] via-[#0f3d32] to-[#106b53] p-5 text-white"
                      title="View Official Sales & Marketing Recruitment Notice"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 font-black text-xs shadow-inner">
                            ELA
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Official Notice</div>
                            <div className="text-xs font-extrabold text-white">E-Lawyers Legal &amp; Business Consultancy</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono bg-black/40 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded">
                          Ref: EL/HR-SME/2026
                        </span>
                      </div>

                      <div className="space-y-1 mb-3">
                        <div className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                          <span>Sales &amp; Marketing Executive</span>
                          <span className="text-[11px] font-semibold text-amber-300 bg-emerald-950/70 px-2 py-0.5 rounded border border-amber-400/30">
                            একাধিক পদ
                          </span>
                        </div>
                        <div className="text-xs text-slate-300">
                          BBA / Marketing / Any Discipline · Base + Commission · Panthapath Office
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-200 bg-white/5 border border-white/10 rounded-xl p-2.5 mb-2">
                        <div><strong className="text-white">Status:</strong> Full-Time / Part-Time</div>
                        <div><strong className="text-white">Incentive:</strong> Uncapped Commission</div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs font-bold text-emerald-200 group-hover/banner:text-white transition-colors">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          View Complete Job Circular &amp; Details
                        </span>
                        <ChevronRight className="w-4 h-4 text-emerald-300 group-hover/banner:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  </div>

                  {/* Incentive Box */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50/90 via-slate-50 to-amber-50/90 border border-emerald-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center font-black text-xs shadow-xs">
                        SME
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#10243a]">Performance-Driven Earnings</div>
                        <div className="text-[11px] text-slate-600">Fixed negotiable base + attractive sales commission</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-900 bg-white px-2.5 py-1 rounded-md border border-emerald-200 whitespace-nowrap shadow-2xs">
                      Multiple Openings
                    </span>
                  </div>
                </div>
              </div>

              {/* High-Impact Call-To-Action (CTA) Dock */}
              <div className="p-6 bg-slate-50/90 border-t border-slate-200 space-y-3 mt-auto">
                <Link
                  to="/Careers/sales-marketing?tab=apply"
                  className="w-full py-4 px-5 bg-gradient-to-r from-[#0a231c] via-[#0f3d32] to-[#106b53] hover:from-[#114b3e] hover:to-[#0a231c] text-amber-300 font-black text-sm sm:text-base rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group-hover:scale-[1.01] border border-amber-300/40"
                >
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  <span>Apply Online — Sales &amp; Marketing Form (অনলাইন আবেদন)</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <Link
                    to="/Careers/sales-marketing"
                    className="flex-1 py-2 px-3 text-center text-xs font-bold text-[#10243a] bg-white hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 shadow-2xs"
                  >
                    View Job Circular (সম্পূর্ণ বিজ্ঞপ্তি)
                  </Link>
                  <span className="text-[11px] text-slate-500 font-semibold bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 whitespace-nowrap">
                    Deadline: Oct 31, 2026
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Side-by-Side Detailed Role Comparison Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-[#10243a]">Position Overview &amp; Side-by-Side Comparison</h3>
              <p className="text-xs text-slate-500 mt-0.5">Compare key requirements, eligibility, responsibilities, and application paths</p>
            </div>
            <div className="text-xs text-slate-500 font-semibold bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              Panthapath, Dhaka Office
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm border-collapse">
              <thead>
                <tr className="bg-[#10243a] text-white">
                  <th className="py-3.5 px-4 font-bold border-r border-slate-700 w-1/5">Criteria / Feature</th>
                  <th className="py-3.5 px-4 font-bold border-r border-slate-700 text-amber-300">
                    Management Trainee (MTO)
                  </th>
                  <th className="py-3.5 px-4 font-bold border-r border-slate-700 text-emerald-300">
                    Sales &amp; Marketing
                  </th>
                  <th className="py-3.5 px-4 font-bold border-r border-slate-700 text-teal-300">
                    Accountant (Accounts)
                  </th>
                  <th className="py-3.5 px-4 font-bold text-amber-200">
                    Customer Care (Female)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-700 bg-slate-50/50">Department</td>
                  <td className="py-3 px-4 text-slate-900 font-semibold">Accounts, Tax, Legal &amp; Consultancy</td>
                  <td className="py-3 px-4 text-slate-900 font-semibold">Sales &amp; Marketing (B2B Services)</td>
                  <td className="py-3 px-4 text-slate-900 font-semibold">Accounts &amp; Tax Compliance</td>
                  <td className="py-3 px-4 text-slate-900 font-semibold">Customer Care / Call Center Desk</td>
                </tr>
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-700 bg-slate-50/50">Number of Vacancies</td>
                  <td className="py-3 px-4 font-bold text-[#10243a]">Multiple Openings</td>
                  <td className="py-3 px-4 font-bold text-emerald-800">Multiple Openings (Male &amp; Female)</td>
                  <td className="py-3 px-4 font-bold text-[#10243a]">২ জন (Male &amp; Female)</td>
                  <td className="py-3 px-4 font-bold text-[#10243a]">২ জন (Female Only)</td>
                </tr>
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-700 bg-slate-50/50">Educational Qualification</td>
                  <td className="py-3 px-4 text-slate-800">
                    Bachelor's in BBA, LL.B, Accounting, Finance, Management
                  </td>
                  <td className="py-3 px-4 text-slate-800">
                    Bachelor's in BBA, Marketing, Management or Any Discipline
                  </td>
                  <td className="py-3 px-4 text-slate-800">
                    BBA / B.Com / M.Com in Accounting or Finance
                  </td>
                  <td className="py-3 px-4 text-slate-800">
                    Minimum HSC or Bachelor Degree in any discipline
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-700 bg-slate-50/50">Experience Level</td>
                  <td className="py-3 px-4 text-slate-800">
                    Fresh graduates welcome; prior internship/projects valued
                  </td>
                  <td className="py-3 px-4 text-slate-800">
                    Fresh graduates welcome; sales, telemarketing or B2B exp. valued
                  </td>
                  <td className="py-3 px-4 text-slate-800">
                    Freshers welcome; internship or 1-2 years experience is a plus
                  </td>
                  <td className="py-3 px-4 text-slate-800">
                    Freshers encouraged; prior customer support exp. prioritized
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-700 bg-slate-50/50">Core Competencies</td>
                  <td className="py-3 px-4 text-slate-800">
                    Analytical problem-solving, MS Word/Excel, multi-departmental coordination
                  </td>
                  <td className="py-3 px-4 text-slate-800">
                    Persuasion, client communication, lead generation, corporate outreach &amp; CRM
                  </td>
                  <td className="py-3 px-4 text-slate-800">
                    Bookkeeping, Excel, TDS/VDS deductions, bank reconciliations
                  </td>
                  <td className="py-3 px-4 text-slate-800">
                    Fluent spoken Bengali, polite phone etiquette, WhatsApp desk
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-700 bg-slate-50/50">Salary &amp; Benefits</td>
                  <td className="py-3 px-4 font-bold text-emerald-700">
                    Negotiable + 2 Festival Bonuses + Mentorship
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-700">
                    Negotiable Base + Commission/Incentives + 2 Festival Bonuses
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-700">
                    BDT 25,000 – 30,000 / mo + 2 Festival Bonuses
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-700">
                    Negotiable based on skills + 2 Festival Bonuses
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-700 bg-slate-50/50">Location</td>
                  <td className="py-3 px-4 text-slate-800">Panthapath, Dhaka (On-site)</td>
                  <td className="py-3 px-4 text-slate-800">Panthapath, Dhaka (On-site)</td>
                  <td className="py-3 px-4 text-slate-800">Panthapath, Dhaka (On-site)</td>
                  <td className="py-3 px-4 text-slate-800">Panthapath, Dhaka (On-site)</td>
                </tr>
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-700 bg-slate-50/50">Application Deadline</td>
                  <td className="py-3 px-4 font-bold text-amber-800">October 31, 2026</td>
                  <td className="py-3 px-4 font-bold text-amber-800">October 31, 2026</td>
                  <td className="py-3 px-4 font-bold text-amber-800">October 31, 2026</td>
                  <td className="py-3 px-4 font-bold text-amber-800">October 31, 2026</td>
                </tr>
                <tr className="bg-slate-50/90">
                  <td className="py-3.5 px-4 font-bold text-slate-700">Online Application Form</td>
                  <td className="py-3.5 px-4">
                    <Link
                      to="/Careers/mto?tab=apply"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10243a] text-amber-300 text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Open MTO Form</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                  <td className="py-3.5 px-4">
                    <Link
                      to="/Careers/sales-marketing?tab=apply"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors shadow-xs"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Open Sales Form</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                  <td className="py-3.5 px-4">
                    <Link
                      to="/Careers/accountant?tab=apply"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#167d83] text-white text-xs font-bold hover:bg-[#106267] transition-colors shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-teal-200" />
                      <span>Open Accountant Form</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                  <td className="py-3.5 px-4">
                    <Link
                      to="/Careers/customer-care?tab=apply"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c7a76b] text-[#10243a] text-xs font-black hover:bg-[#b8975a] transition-colors shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#10243a]" />
                      <span>Open Customer Care Form</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4-Step Application & Selection Flow */}
        <div className="bg-gradient-to-br from-[#10243a] via-[#142e47] to-[#16445a] text-white rounded-2xl p-6 md:p-8 shadow-md">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-bold tracking-widest text-[#ddc38f] uppercase">Structured Selection Process</span>
            <h3 className="text-2xl font-black text-white mt-1">How We Review &amp; Select Candidates</h3>
            <p className="text-xs text-slate-300 mt-1">A transparent, merit-based 4-stage recruitment cycle</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/10 border border-white/15 rounded-xl p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-[#ddc38f] text-[#10243a] text-xs font-extrabold flex items-center justify-center mx-auto mb-2.5 shadow-sm">
                1
              </div>
              <h5 className="font-bold text-sm text-white mb-1">Fill Application Form</h5>
              <p className="text-xs text-slate-300">
                Choose either role, complete our comprehensive online application, and upload your CV (PDF format).
              </p>
            </div>

            <div className="bg-white/10 border border-white/15 rounded-xl p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-[#ddc38f] text-[#10243a] text-xs font-extrabold flex items-center justify-center mx-auto mb-2.5 shadow-sm">
                2
              </div>
              <h5 className="font-bold text-sm text-white mb-1">Get Reference ID</h5>
              <p className="text-xs text-slate-300">
                You receive an official tracking ID (e.g. ELAW-ACC-... or ELAW-CCE-...) for self-service verification.
              </p>
            </div>

            <div className="bg-white/10 border border-white/15 rounded-xl p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-[#ddc38f] text-[#10243a] text-xs font-extrabold flex items-center justify-center mx-auto mb-2.5 shadow-sm">
                3
              </div>
              <h5 className="font-bold text-sm text-white mb-1">Office Assessment</h5>
              <p className="text-xs text-slate-300">
                Shortlisted candidates are invited to our Panthapath office for in-person discussion and skills review.
              </p>
            </div>

            <div className="bg-white/10 border border-white/15 rounded-xl p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-[#ddc38f] text-[#10243a] text-xs font-extrabold flex items-center justify-center mx-auto mb-2.5 shadow-sm">
                4
              </div>
              <h5 className="font-bold text-sm text-white mb-1">Offer &amp; Onboarding</h5>
              <p className="text-xs text-slate-300">
                Selected candidates receive an appointment letter and embark on structured mentorship with senior counsel.
              </p>
            </div>
          </div>
        </div>

        {/* Live Application Status Checker */}
        <div id="check-status" className="app-form-60 w-full lg:w-[60vw] mx-auto bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold tracking-wider text-[#167d83] uppercase">
                Applicant Self-Service Desk
              </span>
              <h3 className="text-xl md:text-2xl font-black text-[#10243a] mt-0.5">
                Check Your Application Status (আবেদনের অবস্থা যাচাই)
              </h3>
              <p className="text-xs md:text-sm text-slate-600 mt-1">
                Already submitted an application? Enter your unique Reference ID or candidate email to check recruitment progress.
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#167d83] border border-teal-200 flex items-center justify-center flex-shrink-0">
              <Search className="w-6 h-6" />
            </div>
          </div>

          <form onSubmit={handleCheckStatus} className="w-full flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={refIdInput}
              onChange={e => setRefIdInput(e.target.value)}
              placeholder="e.g. ELAW-ACC-2026-0001 or candidate email"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83]"
              required
            />
            <button
              type="submit"
              disabled={statusLoading}
              className="px-6 py-2.5 bg-[#10243a] hover:bg-[#193650] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {statusLoading ? 'Verifying...' : 'Check Status'}
            </button>
          </form>

          {/* Status Result Card */}
          {statusResult && (
            <div className="mt-6 animate-fade-in">
              {statusResult.found ? (
                <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-extrabold text-sm">Application Found in E-Lawyers Recruitment Registry</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div><strong>Reference ID:</strong> <span className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-900">{statusResult.referenceId}</span></div>
                    <div><strong>Candidate Name:</strong> {statusResult.candidateName}</div>
                    <div><strong>Position:</strong> {statusResult.position} ({statusResult.department})</div>
                    <div><strong>Current Status:</strong> <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold">{statusResult.status}</span></div>
                    <div><strong>Submission Date:</strong> {statusResult.submittedAt}</div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>{statusResult.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Why Build Your Career at E-Lawyers? */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold tracking-wider text-[#c7a76b] uppercase">Firm Culture &amp; Benefits</span>
            <h3 className="text-2xl md:text-3xl font-extrabold text-[#10243a] mt-1">
              Why Join E-Lawyers Legal &amp; Business Consultancy Firm?
            </h3>
            <p className="text-xs md:text-sm text-slate-600 mt-2">
              We cultivate a culture of excellence, professional dignity, mentorship, and continuous learning.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-teal-100 text-[#167d83] flex items-center justify-center mb-3">
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[#10243a] mb-1">Real Corporate Exposure</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Work directly with corporate businesses, SME accounts, VAT audits, and high-value legal advisories, gaining real-world skills.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-[#c7a76b] flex items-center justify-center mb-3">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[#10243a] mb-1">Fresh Graduate Friendly</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                We nurture emerging talent. Senior chartered accountants and advocates provide hands-on mentorship from day one.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[#10243a] mb-1">Safe &amp; Inclusive Workplace</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                We maintain an exemplary, dignified, and women-friendly workplace environment in our modern Panthapath commercial corporate facility.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[#10243a] mb-1">Festival Bonuses &amp; Incentives</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Competitive monthly compensation, two annual festival bonuses, and timely recognition incentives for high performance.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                <MapPin className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[#10243a] mb-1">Prime Dhaka Location</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Centrally located at BTI Centara Grand, Panthapath / Green Road, easily accessible from Dhanmondi, Farmgate, Tejgaon, and Karwan Bazar.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[#10243a] mb-1">Structured Career Progression</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clear promotion tracks into senior accounting roles, corporate consulting, client relationship management, and team lead positions.
              </p>
            </div>
          </div>
        </div>

        {/* Recruitment FAQ Accordion */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-bold text-[#167d83] uppercase tracking-wider">Candidate Support</span>
            <h3 className="text-2xl font-black text-[#10243a] mt-0.5">Frequently Asked Questions</h3>
            <p className="text-xs md:text-sm text-slate-600 mt-1">
              Find quick answers to common questions regarding our hiring procedure, qualifications, and workplace.
            </p>
          </div>

          <div className="space-y-3 px-[90px]">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 bg-slate-50/70 hover:bg-slate-100/80 transition-colors"
                  >
                    <span className="text-sm font-bold text-[#10243a]">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#167d83]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-2 text-xs md:text-sm text-slate-600 leading-relaxed border-t border-slate-200 bg-white">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Helpdesk & Contact Footer Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold text-[#c7a76b] uppercase tracking-wider">Recruitment Helpdesk</span>
            <h4 className="text-xl font-bold text-[#10243a] mt-0.5">Need Help with Your Application?</h4>
            <p className="text-xs md:text-sm text-slate-600 mt-1 max-w-xl">
              For inquiries regarding circular details, submission queries, or interview status, contact our recruitment team:
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-700">
              <span className="flex items-center gap-1.5 font-semibold">
                <Mail className="w-3.5 h-3.5 text-[#167d83]" /> career@elawyersbd.com
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <Mail className="w-3.5 h-3.5 text-[#167d83]" /> info@elawyersbd.com
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <Phone className="w-3.5 h-3.5 text-[#167d83]" /> +880 1313-583838
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/contact"
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#10243a] font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <MapPin className="w-4 h-4" />
              <span>Office Map</span>
            </Link>
            <a
              href="#check-status"
              className="px-5 py-2.5 rounded-xl bg-[#10243a] hover:bg-[#193650] text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5 text-[#ddc38f]" />
              <span>Check Status</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareersHubPage;
