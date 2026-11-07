import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, BookOpen, Video, FileText, Presentation, Award, 
  CheckCircle2, ArrowRight, ShieldCheck, ChevronDown, ChevronUp, 
  Calculator, FileSpreadsheet, MonitorPlay, Users, Briefcase, 
  Clock, Check, Sparkles, Building2, Scale
} from 'lucide-react';
import { EnrollmentModal } from '../components/training/EnrollmentModal';
import { teamMembers } from '../data/teamData';
import { CourseSEO } from '../components/SEO';

export function PersonalIncomeTaxCourse() {
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [openClass, setOpenClass] = useState<number | null>(1);

  const toggleClass = (num: number) => {
    setOpenClass(openClass === num ? null : num);
  };

  const classesList = [
    {
      num: '01',
      title: 'Introduction to Income Tax & Taxpayer Basics',
      topics: [
        'Tax and income tax fundamentals',
        'Taxpayer categories & legal definitions',
        'Resident and non-resident taxpayers',
        'Income year and assessment year',
        'TIN and the role of tax authorities'
      ],
      practical: 'Identify taxpayer categories and return requirements through practical scenarios.'
    },
    {
      num: '02',
      title: 'Income Tax Return Fundamentals',
      topics: [
        'What is a tax return and why is it mandatory?',
        'Who must file under Income Tax Act 2023?',
        'Filing obligations and statutory deadlines',
        'Consequences of late or non-filing',
        'Introduction to the self-assessment system'
      ],
      practical: 'Analyze different taxpayer situations and determine exact return filing requirements.'
    },
    {
      num: '03',
      title: 'Return Forms & Filing Techniques',
      topics: [
        'Individual income tax return forms breakdown',
        'One-page return and simplified forms',
        'Required schedules and statements',
        'Choosing the correct form for individual assessees',
        'Step-by-step form completion guidelines'
      ],
      practical: 'Complete a sample individual tax return using a realistic taxpayer case.'
    },
    {
      num: '04',
      title: 'Employment, Business & Professional Income',
      topics: [
        'Salary, basic pay, allowances and bonuses',
        'Perquisites and fringe benefits valuation',
        'Calculation of employment income',
        'Business and professional income rules',
        'Allowable and non-allowable business expenses'
      ],
      practical: 'Calculate taxable income for both a salaried employee and a business owner.'
    },
    {
      num: '05',
      title: 'House Property, Agriculture & Other Sources',
      topics: [
        'Income from house property computation',
        'Annual rental value determination',
        'Allowable repair and municipal tax expenses',
        'Agricultural income computation and exemptions',
        'Income from other sources (bank interest, casual earnings)'
      ],
      practical: 'Calculate house property and agricultural income using practical computation sheets.'
    },
    {
      num: '06',
      title: 'Capital Gains & Financial Assets',
      topics: [
        'Principles of capital income and asset transfer',
        'Capital gains tax on land, building, shares & assets',
        'Financial assets, bank interest and FDIs',
        'Dividend income taxation rules',
        'Relevant allowable expenses in capital transfers'
      ],
      practical: 'Calculate income from asset transfers, bank interest, and dividend yields.'
    },
    {
      num: '07',
      title: 'Total Income & Tax Calculation',
      topics: [
        'Aggregating income from different heads',
        'Determining total income and taxable income',
        'Tax-free thresholds and applicable tax slabs',
        'Calculation of minimum tax for individuals',
        'Computing final tax liability before rebates'
      ],
      practical: 'Complete a full individual tax calculation case study from start to finish.'
    },
    {
      num: '08',
      title: 'Tax Rebate, Withholding Tax & Advance Tax',
      topics: [
        'Tax rebate on qualifying investments (DPS, shares, insurance)',
        'Qualifying investment ceilings and limits',
        'Withholding tax (TDS) concepts and certificates',
        'Tax credit and advance tax adjustments',
        'Final tax liability reconciliation'
      ],
      practical: 'Calculate investment rebates and adjust withholding/advance tax to determine net payable tax.'
    },
    {
      num: '09',
      title: 'Surcharge, Wealth Statement & Complete Return',
      topics: [
        'Surcharge calculation on high-net-worth individuals',
        'Assets, liabilities and net wealth statements',
        'Personal expense statements and reconciliation',
        'Required supporting documents & annexures',
        'Common return filing mistakes to avoid'
      ],
      practical: 'Prepare a complete individual tax return case including wealth statement and liabilities.'
    },
    {
      num: '10',
      title: 'Online e-Return Filing',
      topics: [
        'National Board of Revenue (NBR) e-Return portal registration & login',
        'Taxpayer profile setup & data entry workflow',
        'Income data entry across all heads',
        'Adding tax rebate, assets and liabilities online',
        'Verification, challan payment, and online submission'
      ],
      practical: 'Complete an end-to-end online e-Return filing simulation on NBR platform.'
    }
  ];

  const whatIsIncluded = [
    {
      icon: <Video className="w-6 h-6 text-emerald-600" />,
      title: "Video Lectures",
      desc: "Recorded, step-by-step lessons explaining each tax concept and calculation clearly."
    },
    {
      icon: <FileText className="w-6 h-6 text-emerald-600" />,
      title: "Downloadable PDF Notes",
      desc: "Structured notes and legal summaries for quick review during return preparation."
    },
    {
      icon: <Presentation className="w-6 h-6 text-emerald-600" />,
      title: "PowerPoint Slides",
      desc: "Visual explanations of tax rules, thresholds, calculations, and statutory forms."
    },
    {
      icon: <Sparkles className="w-6 h-6 text-emerald-600" />,
      title: "Practical Case Studies",
      desc: "Realistic Bangladesh-based taxpayer examples covering diverse income levels."
    },
    {
      icon: <FileSpreadsheet className="w-6 h-6 text-emerald-600" />,
      title: "Sample Tax Returns",
      desc: "Fully filled reference return forms and schedules for practical guidance."
    },
    {
      icon: <Calculator className="w-6 h-6 text-emerald-600" />,
      title: "Tax Calculation Worksheets",
      desc: "Excel worksheets for income aggregation, rebate calculation, and tax liability."
    },
    {
      icon: <MonitorPlay className="w-6 h-6 text-emerald-600" />,
      title: "e-Return Demonstrations",
      desc: "Over-the-shoulder video walkthroughs of the NBR online e-Return filing system."
    },
    {
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
      title: "Module-wise Quizzes",
      desc: "Interactive assessments after each module to test your understanding."
    },
    {
      icon: <Award className="w-6 h-6 text-emerald-600" />,
      title: "Verifiable Certificate",
      desc: "Official Certificate of Completion issued by E-Lawyers Academy upon finishing."
    }
  ];

  const outcomes = [
    "Understand the Bangladesh Income Tax System & Act 2023",
    "Accurately calculate taxable income across all heads",
    "Prepare individual income tax returns professionally",
    "Calculate tax rebates on qualifying investments",
    "Prepare accurate wealth statements (assets & liabilities)",
    "Determine minimum tax and surcharge thresholds",
    "Prepare salary and employment income returns",
    "Assess house property and agricultural income correctly",
    "Prepare returns for sole proprietorship businesses",
    "Understand partnership business taxation basics",
    "Submit online e-Returns independently via NBR portal",
    "Manage client tax files with confidence and accuracy"
  ];

  const targetAudience = [
    { title: "Students", desc: "Building practical career skills in taxation and accounting." },
    { title: "Accountants", desc: "Enhancing corporate compliance and tax filing capabilities." },
    { title: "Finance Professionals", desc: "Upgrading advisory skills on tax planning and return preparation." },
    { title: "Tax Practitioners", desc: "Mastering the Income Tax Act 2023 and e-Return portals." },
    { title: "Business Owners", desc: "Managing company and personal tax filings efficiently." },
    { title: "Entrepreneurs", desc: "Ensuring personal and business tax compliance from day one." },
    { title: "Freelancers", desc: "Filing your own returns and claiming tax exemptions legally." },
    { title: "Lawyers", desc: "Adding corporate and tax practice expertise to your legal career." },
    { title: "Company Executives", desc: "Handling executive tax planning, rebates, and wealth statements." }
  ];

  const opportunities = [
    {
      title: "Professional Tax Services",
      desc: "Develop practical skills to assist individual taxpayers with return preparation and submission during tax season."
    },
    {
      title: "Freelance Tax Services",
      desc: "Provide return preparation and tax consultancy services remotely to individuals and small businesses."
    },
    {
      title: "Corporate Tax Support",
      desc: "Add valuable taxation competencies to your accounting, finance, legal, or corporate compliance career."
    },
    {
      title: "Personal Tax Management",
      desc: "Prepare and manage your own income tax, assets, liabilities, and tax documentation with absolute confidence."
    },
    {
      title: "Career Growth",
      desc: "Strengthen your professional CV and credentials with verified expertise in Bangladesh income tax compliance."
    }
  ];

  const faqs = [
    {
      q: "Is this course suitable for beginners?",
      a: "Yes. The program starts with fundamental tax concepts and taxpayer basics, gradually advancing into complex income calculations, wealth statements, and online e-Return submission."
    },
    {
      q: "Are these live classes or recorded?",
      a: "The program consists of 10 Live Interactive Classes held on November 24, 27, 30, 31, 2026 & December 3, 6, 7, 10, 13, 14, 2026. Full video recordings of all live sessions are also provided for lifetime review."
    },
    {
      q: "Will I learn online e-Return filing?",
      a: "Yes. Class 10 provides a complete end-to-end practical e-Return filing demonstration on the National Board of Revenue (NBR) portal."
    },
    {
      q: "Are practical case studies included?",
      a: "Yes. Every class includes realistic taxpayer case studies, calculation worksheets, and sample completed returns."
    },
    {
      q: "Will I receive a certificate?",
      a: "Yes. Upon successful completion of the training and required online quizzes, you will receive a Verifiable Certificate of Completion from E-Lawyers Academy."
    },
    {
      q: "Who can benefit from this course?",
      a: "Students, accountants, finance professionals, tax practitioners, business owners, entrepreneurs, freelancers, lawyers, and company executives looking to master personal income tax returns."
    }
  ];

  const mentors = teamMembers.filter(m => 
    [
      'Ekramul Islam Khandaker', 
      'Advocate Anamul Haque', 
      'Md. Abu Hanif', 
      'Muhammad Abdul Kader ACCA', 
      'Rafi Rahman ACCA',
      'Advocate Muzammel Haque'
    ].includes(m.name)
  );

  return (
    <div className="bg-white text-slate-950 font-sans selection:bg-emerald-100 selection:text-emerald-800">
      <CourseSEO
        title="Practical Personal Income Tax Assessment & Return Filing Course (ITA 2023) | E-Lawyers Academy"
        description="Master personal income tax computation, investment tax rebates, and online e-Return filing under the Income Tax Act 2023 across 10 live interactive classes."
        canonicalUrl="/course/personal-income-tax"
        keywords={['Personal Income Tax Course Bangladesh', 'ITA 2023 Training', 'Tax Return Filing Course', 'E-Lawyers Academy']}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Training Hub', url: '/training' },
          { name: 'Personal Income Tax Course', url: '/course/personal-income-tax' }
        ]}
      />
      
      {/* Announcement Bar */}
      <div className="bg-emerald-50/90 text-emerald-950 text-xs py-2.5 px-4 text-center font-semibold border-b border-emerald-200/80 flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
        <span>E-Lawyers Academy • 10 Live Interactive Classes Schedule: Nov 24, 27, 30, 31, 2026 & Dec 3, 6, 7, 10, 13, 14, 2026</span>
      </div>

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-[#fdfaf3] to-emerald-50/50 text-slate-900 border-b border-slate-200/90 py-10 sm:py-14">
        {/* Subtle background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-400/15 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[250px] bg-amber-300/20 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-[50px] relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Hero Content */}
            <div className="lg:col-span-7 space-y-8 text-left">
              
              {/* Brand Tag / Rating Badge */}
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full text-xs font-bold bg-white text-slate-800 border border-slate-200/90 shadow-2xs">
                <div className="flex items-center gap-1 text-amber-500">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
                <span className="text-slate-700">4.9/5 Rating by Tax Professionals & Accountants</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.08]">
                Master Personal <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-600">Income Tax Return Filing</span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl">
                Learn Bangladesh Income Tax Law, tax calculation, rebate, wealth statements and NBR e-Return filing through 10 Live Interactive Classes by <strong className="text-slate-900">E-Lawyers Academy</strong>.
              </p>

              {/* Feature Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {[
                  { icon: <Video className="w-4 h-4 text-emerald-600" />, label: "10 Live Classes" },
                  { icon: <MonitorPlay className="w-4 h-4 text-emerald-600" />, label: "Interactive Training" },
                  { icon: <Sparkles className="w-4 h-4 text-amber-600" />, label: "Practical Case Studies" },
                  { icon: <Award className="w-4 h-4 text-emerald-600" />, label: "Verifiable Certificate" }
                ].map((pill, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200/90 text-xs font-bold text-slate-800 shadow-2xs">
                    {pill.icon}
                    <span className="line-clamp-1">{pill.label}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-4 pt-2">
                <Link
                  to="/student/course/personal-income-tax"
                  className="px-8 py-4 rounded-2xl font-black text-base bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white transition-all shadow-lg flex items-center justify-center gap-3 cursor-pointer"
                >
                  <span>Enter Student Learning Portal</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => setIsEnrollModalOpen(true)}
                  className="px-7 py-4 rounded-2xl font-bold text-sm bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Enroll Now</span>
                </button>
                <Link
                  to="/verify-certificate"
                  className="px-6 py-4 rounded-2xl font-bold text-sm bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200 transition-all text-center flex items-center justify-center gap-2"
                >
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Verify Certificate</span>
                </Link>
              </div>

              {/* Trust Line */}
              <div className="pt-2 flex items-center gap-3 text-xs text-slate-600 font-medium">
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white border-2 border-white shadow-2xs">EA</div>
                  <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-[10px] font-bold text-white border-2 border-white shadow-2xs">TP</div>
                  <div className="w-7 h-7 rounded-full bg-amber-600 flex items-center justify-center text-[10px] font-bold text-white border-2 border-white shadow-2xs">AC</div>
                </div>
                <span>Joined by 1,200+ Students, Accountants & Tax Practitioners across Bangladesh</span>
              </div>
            </div>

            {/* Hero Card / Dashboard Visual */}
            <div className="lg:col-span-5">
              <div className="bg-white p-8 sm:p-10 rounded-3xl border-2 border-slate-200/90 shadow-xl relative">
                <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[11px] uppercase tracking-wider px-4 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                  <span>★ Bestseller Course</span>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-5">
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-700 font-extrabold block">E-Lawyers Academy</span>
                      <h3 className="text-xl font-black text-slate-900 mt-0.5">Personal Income Tax Mastery</h3>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
                      <FileText className="w-7 h-7" />
                    </div>
                  </div>

                  <div className="space-y-3.5 text-sm">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-emerald-600" /> Format:</span>
                      <strong className="text-slate-900">10 Live Interactive Classes</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-emerald-600" /> Standard:</span>
                      <strong className="text-slate-900">Income Tax Act 2023</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-2"><Award className="w-4 h-4 text-amber-600" /> Certification:</span>
                      <strong className="text-emerald-700">Verifiable PDF Certificate</strong>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-1.5">
                    <div className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-800 flex items-center gap-1.5 font-mono">
                      <span>📅 Live Class Dates (2026):</span>
                    </div>
                    <div className="text-xs text-slate-900 font-bold leading-relaxed">
                      Nov 24, 27, 30, 31 & Dec 3, 6, 7, 10, 13, 14, 2026
                    </div>
                  </div>

                  <button
                    onClick={() => setIsEnrollModalOpen(true)}
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-black text-base transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
                  >
                    <span>Enroll Now</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <p className="text-[11px] text-center text-slate-500 font-medium">
                    Instant lifetime access to video lectures, notes & worksheets.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. COURSE OVERVIEW & LEARNING JOURNEY */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
              Structured Curriculum
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              From Tax Law to Practical Return Filing
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              Going far beyond theoretical definitions, this program teaches you how to identify diverse income sources, determine taxable income, apply eligible tax rebates, adjust withholding and advance tax, prepare assets & liabilities, and successfully submit returns online.
            </p>
          </div>

          {/* Visual Learning Journey */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 text-center mb-8">
              Step-by-Step Practical Learning Journey
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {[
                { step: '01', title: 'Income ID', desc: 'Identify heads of income' },
                { step: '02', title: 'Taxable Income', desc: 'Deductions & exemptions' },
                { step: '03', title: 'Tax Calc', desc: 'Slabs & minimum tax' },
                { step: '04', title: 'Tax Rebate', desc: 'Qualifying investments' },
                { step: '05', title: 'Withholding', desc: 'TDS & advance tax' },
                { step: '06', title: 'Assets & Debts', desc: 'Wealth statement' },
                { step: '07', title: 'Preparation', desc: 'Form completion' },
                { step: '08', title: 'e-Return', desc: 'Online submission' }
              ].map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 hover:bg-emerald-50/50 rounded-2xl border border-slate-200/80 transition-all text-center flex flex-col justify-between group">
                  <div>
                    <span className="w-7 h-7 rounded-xl bg-slate-900 text-white group-hover:bg-emerald-600 text-xs font-bold inline-flex items-center justify-center mb-2 transition-colors">
                      {item.step}
                    </span>
                    <h4 className="text-xs font-extrabold text-slate-900 mb-1">{item.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHY LEARN PERSONAL INCOME TAX? */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center px-[10px] pt-0">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Core Competency
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Why Learn Personal Income Tax Return Filing?
              </h2>
              <p className="text-slate-600 text-base leading-relaxed">
                A tax return is much more than filling out a form. Income, investments, assets, liabilities, and expenses must be meticulously organized and reconciled to determine accurate tax liability and ensure flawless compliance.
              </p>
              <p className="text-slate-600 text-base leading-relaxed">
                Mastering these areas enables you to handle your own taxes without professional errors and opens doors to lucrative professional tax advisory opportunities.
              </p>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: "Tax Return Preparation", desc: "Master individual, employee, and business return schedules." },
                { title: "e-Return Submission", desc: "Navigate the NBR online portal with complete confidence." },
                { title: "Tax Calculation", desc: "Compute total income, slabs, and final tax liabilities accurately." },
                { title: "Tax Rebate", desc: "Maximize eligible investment rebates (DPS, insurance, shares)." },
                { title: "Wealth Statements", desc: "Prepare assets, liabilities, and personal expense statements." },
                { title: "Tax Compliance", desc: "Avoid penalties, audits, and compliance discrepancies." }
              ].map((item, idx) => (
                <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 hover:border-emerald-300 transition-all space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. COURSE CURRICULUM (10 CLASSES) */}
      <section id="curriculum" className="py-20 bg-slate-900 text-white scroll-mt-10">
        <div className="max-w-5xl mx-auto px-[100px]">
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              10 Comprehensive Classes
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Course Curriculum & Class Breakdown
            </h2>
            <p className="text-slate-400 text-base max-w-2xl mx-auto">
              Progressive curriculum designed so each class builds upon previous knowledge, combining statutory law with practical case studies.
            </p>
          </div>

          <div className="space-y-4">
            {classesList.map((cls) => {
              const isOpen = openClass === Number(cls.num);
              return (
                <div 
                  key={cls.num}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isOpen ? 'bg-slate-800/95 border-amber-500/50 shadow-2xl ring-1 ring-amber-500/20' : 'bg-slate-800/40 border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <button
                    onClick={() => toggleClass(Number(cls.num))}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono font-black text-sm flex items-center justify-center shrink-0 shadow-inner">
                        {cls.num}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">Class {cls.num}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-[10px] font-semibold text-emerald-400">Recorded Video & Notes</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mt-0.5">{cls.title}</h3>
                      </div>
                    </div>
                    <div className="text-slate-400 p-2 rounded-xl bg-slate-900/60 border border-slate-700/80">
                      {isOpen ? <ChevronUp className="w-4 h-4 text-amber-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-700/60 space-y-5 text-sm animate-in fade-in duration-200">
                      <div className="space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Topics Covered:</span>
                        </span>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {cls.topics.map((topic, i) => (
                            <li key={i} className="flex items-start gap-2 text-slate-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                              <span className="text-xs leading-relaxed font-medium">{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-slate-900/90 rounded-2xl border border-amber-500/30 flex items-start gap-3.5 shadow-md">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 font-black text-xs">
                          ⚡
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 font-mono">
                              Practical Session & Exercise
                            </span>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed font-medium">
                            {cls.practical}
                          </p>
                        </div>
                      </div>

                      {/* Direct Class Learning Page Links (Video, Notes, PPT, Quiz) */}
                      <div className="pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs text-slate-400 font-medium">
                          Open Class {cls.num} Learning Materials on Dedicated Page:
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/student/course/personal-income-tax/lesson/cls_${cls.num}/video`}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Watch Video</span>
                          </Link>
                          <Link
                            to={`/student/course/personal-income-tax/lesson/cls_${cls.num}/notes`}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Read Notes</span>
                          </Link>
                          <Link
                            to={`/student/course/personal-income-tax/lesson/cls_${cls.num}/ppt`}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <Presentation className="w-3.5 h-3.5 text-amber-400" />
                            <span>View PPT</span>
                          </Link>
                          <Link
                            to={`/student/course/personal-income-tax/lesson/cls_${cls.num}/quiz`}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Take Quiz</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={() => setIsEnrollModalOpen(true)}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-extrabold text-sm transition-all shadow-lg flex items-center justify-center gap-2 mx-auto cursor-pointer"
            >
              <span>Enroll in the 10-Class Program</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. WHAT'S INCLUDED */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
              Complete Package
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              What Is Included in Every Class
            </h2>
            <p className="text-slate-600 text-base max-w-2xl mx-auto">
              Every class comes with a robust learning package designed for absolute clarity and real-world application.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-[100px]">
            {whatIsIncluded.map((item, idx) => (
              <div key={idx} className="p-6 bg-slate-50 hover:bg-white rounded-3xl border border-slate-200/80 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. LEARNING OUTCOMES */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
              Core Competencies
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              What You’ll Be Able to Do
            </h2>
            <p className="text-slate-600 text-base max-w-2xl mx-auto">
              After completing the program, you will possess practical, job-ready tax return preparation and compliance skills.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-[100px]">
            {outcomes.map((outcome, idx) => (
              <div key={idx} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-black text-xs">
                  ✓
                </div>
                <span className="text-xs font-bold text-slate-800 leading-snug">{outcome}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. WHO SHOULD ENROLL? */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Target Audience
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Who Should Enroll?
            </h2>
            <p className="text-slate-600 text-base max-w-2xl mx-auto">
              Whether you want to manage your own tax compliance or develop professional tax-return skills, this program gives you a practical foundation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-[100px]">
            {targetAudience.map((item, idx) => (
              <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. PROFESSIONAL OPPORTUNITIES */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              Career & Practice
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Turn Tax Knowledge into Professional Skills
            </h2>
            <p className="text-slate-400 text-base max-w-2xl mx-auto">
              Practical income tax knowledge can be applied across several professional areas to create real value.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-[100px]">
            {opportunities.map((opp, idx) => (
              <div key={idx} className="p-6 bg-slate-800/80 rounded-3xl border border-slate-700/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                  💼
                </div>
                <h3 className="font-bold text-white text-base">{opp.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{opp.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COURSE MENTORS & EXPERT FACULTY */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
              Expert Leadership & Instructors
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Meet Your Course Mentors
            </h2>
            <p className="text-slate-600 text-base max-w-2xl mx-auto">
              Learn directly from seasoned lawyers, tax practitioners, and chartered accountants with decades of combined advisory and compliance experience in Bangladesh.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-[100px]">
            {mentors.map((mentor, idx) => (
              <div key={idx} className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={mentor.imgSrc} 
                      alt={mentor.name} 
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-600 shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {mentor.name}
                      </h3>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md inline-block mt-1">
                        {mentor.position}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
                    {mentor.bio}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
                  <span className="font-semibold text-slate-700">Expertise: {mentor.expertise}</span>
                  {mentor.email && (
                    <a href={`mailto:${mentor.email}`} className="text-emerald-600 hover:underline">
                      Contact
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. CERTIFICATE SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center px-[100px]">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Official Credential
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Earn a Verifiable Certificate
              </h2>
              <p className="text-slate-600 text-base leading-relaxed">
                Successfully complete the training and required online quizzes to receive an official **Verifiable Certificate of Completion** from **E-Lawyers Academy**.
              </p>
              
              <div className="space-y-3">
                {[
                  { title: "Professional Recognition", desc: "Demonstrate verified training in personal income tax return preparation." },
                  { title: "Stronger Professional Profile", desc: "Add the certificate directly to your CV, LinkedIn profile, and job applications." },
                  { title: "Career Advancement", desc: "Gain competitive advantage in accounting, tax advisory, and corporate finance." }
                ].map((b, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold mt-0.5 shrink-0">
                      ✓
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">{b.title}</strong>
                      <span className="text-xs text-slate-600">{b.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Certificate Mockup Visual */}
            <div className="lg:col-span-6">
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 sm:p-10 rounded-3xl text-white shadow-xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="border border-amber-500/40 p-6 sm:p-8 rounded-2xl bg-slate-950/60 text-center space-y-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                    E-Lawyers Academy • Certificate of Completion
                  </span>
                  <h4 className="text-lg sm:text-xl font-black text-white">
                    Personal Income Tax Return Filing Training
                  </h4>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto">
                    This is to certify that the participant has successfully completed the 10-class practical training program on Bangladesh Income Tax Act 2023 & e-Return submission.
                  </p>
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800">
                    <span>Verified Credential</span>
                    <span className="text-emerald-400 font-bold">E-Lawyers Academy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. PRACTICAL LEARNING WORKFLOW */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
              Real-World Simulation
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Learn by Working Through Real Cases
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              Students work through realistic taxpayer scenarios covering employment income, business profits, house property, agricultural yields, capital gains, tax rebates, withholding adjustments, and online e-Return submission.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              "Salary & Allowances",
              "Business & Profession",
              "House Property",
              "Agricultural Income",
              "Capital Gains",
              "Investment Rebates",
              "Wealth Statements",
              "NBR e-Return Portal"
            ].map((item, idx) => (
              <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs font-bold text-xs text-slate-800 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 12. FAQ SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Common Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600 text-base">
              Everything you need to know about the training program.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-left">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <span className="text-emerald-600">Q:</span> {faq.q}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed pl-5">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 13. FINAL CTA SECTION */}
      <section style={{ paddingTop: '80px' }} className="py-20 bg-slate-50 text-slate-900 text-center relative overflow-hidden border-t border-slate-200">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full">
            Enroll Today
          </span>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Build Practical Income Tax Skills That You Can Use
          </h2>

          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Learn tax calculation, return preparation and online e-Return filing through one structured practical program.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setIsEnrollModalOpen(true)}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-extrabold text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <span>Enroll Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#curriculum"
              className="px-8 py-4 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-2xl font-bold text-sm transition-all shadow-2xs"
            >
              <span>Explore the 10-Class Curriculum</span>
            </a>
          </div>
        </div>
      </section>

      {/* Enrollment Modal */}
      <EnrollmentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title="Personal Income Tax Return Filing Training"
        description="Comprehensive 10-Class recorded training program on Bangladesh Income Tax Law, calculation, rebate, and NBR e-Return filing."
        price="BDT 10,000 - 20,000"
      />

    </div>
  );
}
