import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  GraduationCap,
  Briefcase,
  FileText,
  Gavel,
  FileCheck,
  MonitorPlay,
  Award,
  ArrowRight,
  Clock,
  ShieldCheck,
  Video,
  Calendar,
  Users
} from 'lucide-react';
import { mockArticles } from '../data/mockData';
import { EnrollmentModal } from '../components/training/EnrollmentModal';
import { CertificateModal } from '../components/training/CertificateModal';
import { TrainingFAQ } from '../components/training/TrainingFAQ';
import { CareerPathways } from '../components/training/CareerPathways';
import { SEO } from '../components/SEO';
import { getAcademyCourseDashboardPath } from '../utils/lmsPortalStore';
import { usePurchases } from '../contexts/PurchaseContext';
import { TrainingAdmissionModal } from '../components/training/TrainingAdmissionModal';
import { useAuth } from '../contexts/AuthContext';
import { useShopAuth } from '../contexts/ShopAuthContext';

interface LiveClassProgram {
  id: string;
  title: string;
  bengaliTag: string;
  scheduleLabel: string;
  nextSessionDate: string;
  timeSlot: string;
  instructor: string;
  seatsLabel: string;
  price: string;
  excerpt: string;
  detailPath: string;
  colorClass: string;
  icon: React.ReactNode;
}

export function TrainingHub() {
  const { user } = useAuth();
  const { adminUser } = useShopAuth();
  const { isPurchased, isPendingPurchase } = usePurchases();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<{
    id: string;
    title: string;
    description: string;
    price: string;
  } | null>(null);

  // Admission modal state
  const [isAdmissionOpen, setIsAdmissionOpen] = useState(false);
  const [admissionCourse, setAdmissionCourse] = useState<{ id: string; name: string } | null>(null);

  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [certCourse] = useState<{ title: string; id: string } | null>(null);

  const trainingIds = ['400', '401', '402', '403', '404', '405', '406'];
  const trainingArticles = mockArticles.filter((a) => trainingIds.includes(a.id));

  const icons: Record<string, React.ReactNode> = {
    '400': <FileCheck className="w-6 h-6" />, // VAT
    '401': <FileText className="w-6 h-6" />, // Income Tax
    '402': <Briefcase className="w-6 h-6" />, // RJSC
    '403': <Gavel className="w-6 h-6" />, // Bar Council
    '404': <BookOpen className="w-6 h-6" />, // High Court
    '405': <GraduationCap className="w-6 h-6" />, // Practical Accounting
    '406': <MonitorPlay className="w-6 h-6" /> // MS Office
  };

  const colors: Record<string, string> = {
    '400': 'bg-blue-50 text-blue-700 border-blue-200/80',
    '401': 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    '402': 'bg-purple-50 text-purple-700 border-purple-200/80',
    '403': 'bg-amber-50 text-amber-700 border-amber-200/80',
    '404': 'bg-rose-50 text-rose-700 border-rose-200/80',
    '405': 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
    '406': 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
  };

  const prices: Record<string, string> = {
    '400': 'BDT 50,000 – 150,000',
    '401': 'BDT 10,000 – 20,000',
    '402': 'BDT 500 – 3,000',
    '403': 'BDT 10,000 – 20,000',
    '404': 'BDT 5,000 – 10,000',
    '405': 'BDT 500 – 5,000',
    '406': 'Free – BDT 5,000'
  };

  const durations: Record<string, string> = {
    '400': '360 Hours · Advanced',
    '401': '30 Hours · 10 Classes',
    '402': '6 Hours · Workshop',
    '403': '60 Hours · Bar Prep',
    '404': '40 Hours · High Court',
    '405': '20 Hours · Practical',
    '406': '48 Hours · Foundation'
  };

  const courseProductMap: Record<string, string> = {
    '400': 'prod-course-vat-sd',
    '401': 'prod-course-income-tax',
    '402': 'prod-course-rjsc-mastery',
    '403': 'prod-course-bar-council',
    '404': 'prod-course-high-court',
    '405': 'prod-course-practical-accounting',
    '406': 'prod-course-ms-office'
  };

  const liveClassPrograms: LiveClassProgram[] = [
    {
      id: 'live-income-tax-2026',
      title: 'Live Class: Personal Income Tax & Online e-Return Filing Masterclass',
      bengaliTag: 'LIVE COHORT 01 · INCOME TAX & E-RETURN',
      scheduleLabel: '10 Live Classes · Zoom / Meet',
      nextSessionDate: 'Nov 24, 2026',
      timeSlot: '8:30 PM – 10:30 PM BST',
      instructor: 'Adv. Ekram Hossain',
      seatsLabel: 'Live Interactive Q&A',
      price: 'BDT 3,500',
      excerpt:
        'Master the Income Tax Act 2023, multi-head tax calculations, investment rebates, wealth statements, and step-by-step live online e-Return filing on the NBR portal.',
      detailPath: '/course/personal-income-tax',
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      icon: <Video className="w-6 h-6" />
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <SEO
        title="Academy | Live Classes & Professional Legal, Tax, VAT & RJSC Training Programs"
        description="Join interactive Live Classes and practical legal, income tax, VAT, accounting, and RJSC corporate compliance training programs with verifiable certification."
        canonicalUrl="/training"
      />

      {/* Page Hero Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-2xs">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span>E-Lawyers &amp; Accounticca Academy • Learn Today, Lead Tomorrow</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Professional Training &amp; Live Class Academy
          </h1>

          <p className="text-slate-600 text-sm sm:text-base lg:text-lg leading-relaxed">
            Practical legal, income tax, VAT, accounting, and RJSC compliance live classes and courses designed to build real-world statutory expertise for practitioners, students, and corporate leaders.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#live-classes-section"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs whitespace-nowrap shrink-0"
            >
              <Video className="w-4 h-4 text-emerald-100" />
              <span>Live Classes</span>
            </a>
            <Link
              to="/student/dashboard?tab=live"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs whitespace-nowrap shrink-0"
            >
              <MonitorPlay className="w-4 h-4 text-emerald-400" />
              <span>Open Student Learning Portal (LMS)</span>
            </Link>
            <Link
              to="/verify-certificate"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Public Certificate Verification</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="p-2.5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col items-center w-full max-w-[580px] mx-auto overflow-hidden">
        <iframe
          src="https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2Felawyerssbd%2Fvideos%2F1271548471021064%2F&show_text=false&width=560&t=0"
          width="560"
          height="314"
          className="border-0 overflow-hidden rounded-2xl bg-black w-full max-w-full aspect-video"
          scrolling="no"
          frameBorder="0"
          allowFullScreen={true}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          title="E-Lawyers & Accounticca Academy Featured Training Video"
        />
      </div>

      {/* Featured Academy Video Reels & Live Class Spotlight */}
      <section
        id="live-classes-section"
        className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 lg:p-10 shadow-2xs"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Context & Live Cohort Details */}
          <div className="lg:col-span-6 space-y-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <Video className="w-4 h-4 text-emerald-600" />
              <span>Featured Academy Reels</span>
              <span aria-hidden="true">·</span>
              <span>Practical Tax, VAT &amp; Legal Training</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Watch Inside Our Practical Training &amp; Live Sessions
            </h2>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Experience how our instructors break down real-world Income Tax Act 2023 calculations, online e-Return filing, VAT compliance, and RJSC corporate procedures for practitioners and learners across Bangladesh.
            </p>

            {liveClassPrograms.map((program) => {
              const liveOwned = isPurchased(program.id) || isPurchased('prod-course-income-tax');
              return (
                <div
                  key={program.id}
                  className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-bold text-emerald-700">{program.bengaliTag}</span>
                    <span aria-hidden="true">·</span>
                    <span>{program.scheduleLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-800">
                      {program.price}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {program.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {program.excerpt}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <Link
                      to={program.detailPath}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>{liveOwned ? 'View Product' : 'View Course Syllabus'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    {liveOwned ? (
                      <Link
                        to="/client-portal"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0"
                      >
                        <MonitorPlay className="w-4 h-4 text-emerald-400" />
                        <span>Go to Dashboard</span>
                      </Link>
                    ) : (
                      <>
                        <Link
                          to={getAcademyCourseDashboardPath(program.title)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0"
                        >
                          <MonitorPlay className="w-4 h-4 text-emerald-600" />
                          <span>Student Dashboard</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCourse({
                              id: program.id,
                              title: program.title,
                              description: program.excerpt,
                              price: program.price
                            });
                            setIsModalOpen(true);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <span>Buy Now</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAdmissionCourse({ id: program.id, name: program.title });
                            setIsAdmissionOpen(true);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-black transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
                        >
                          <GraduationCap className="w-4 h-4" />
                          <span>Apply for Admission</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/*Right: Embedded Facebook Videos (2 Reels 269x476 + 1 Landscape 560x314) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="p-2.5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col items-center">
                <iframe
                  src="https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F1289755342457988%2F&show_text=false&width=269&t=0"
                  width="269"
                  height="476"
                  className="border-0 overflow-hidden rounded-2xl bg-black"
                  scrolling="no"
                  frameBorder="0"
                  allowFullScreen={true}
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  title="E-Lawyers & Accounticca Academy Featured Training Reel 1"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Training Programs Grid (Balanced Cards with Uniform Action Footers) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Academy Courses &amp; Certification Tracks
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Select a specialized program below to inspect the curriculum or register for the upcoming cohort.
            </p>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-500">
            Showing {trainingArticles.length + 1} Active Programs
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {trainingArticles.map((article) => {
            const colorClass =
              colors[article.id] || 'bg-slate-100 text-slate-700 border-slate-200';
            const icon = icons[article.id] || <BookOpen className="w-6 h-6" />;
            const price = prices[article.id] || 'Price upon request';
            const duration = durations[article.id] || 'Self-Paced · Certified';
            const courseImages: Record<string, string> = {
              '400': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800',
              '401': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=800',
              '402': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800',
              '403': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800',
              '404': 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&q=80&w=800',
              '405': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
              '406': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800'
            };
            const coverImg = courseImages[article.id] || article.imageUrl;
            const detailPath =
              article.id === '401'
                ? '/course/personal-income-tax'
                : `/article/${article.id}`;
            const courseDashboardPath = getAcademyCourseDashboardPath(article.title);
            const mappedShopId = courseProductMap[article.id] || article.id;
            const courseOwned = isPurchased(article.id) || isPurchased(mappedShopId);
            const coursePending = isPendingPurchase(article.id) || isPendingPurchase(mappedShopId);

            return (
              <div
                key={article.id}
                className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <Link to={courseDashboardPath} className="block relative h-44 w-full overflow-hidden bg-slate-100">
                    <img
                      src={coverImg}
                      alt={article.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-xs backdrop-blur-xs ${colorClass}`}
                      >
                        {icon}
                      </div>
                    </div>
                    <span className="absolute bottom-3 right-3 text-[11px] font-mono tabular-nums text-white bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-lg flex items-center gap-1 border border-white/15">
                      <Clock className="w-3 h-3 text-emerald-400" />
                      <span>{duration}</span>
                    </span>
                  </Link>

                  <div className="p-5 pb-0">
                    <Link to={courseDashboardPath} className="block">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                        {article.title}
                      </h3>
                    </Link>
                    <p className="text-slate-600 text-xs sm:text-sm line-clamp-3 mt-2 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-4 mt-4 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Program Fee</span>
                    <span className="font-mono tabular-nums font-bold text-slate-900">
                      {price}
                    </span>
                  </div>

                  {courseOwned ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to={detailPath}
                        className="py-2.5 px-3 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold transition-colors text-xs flex items-center justify-center gap-1 whitespace-nowrap shrink-0"
                      >
                        <span>View Product</span>
                      </Link>
                      <Link
                        to="/client-portal"
                        className="py-2.5 px-3 bg-emerald-700 text-white hover:bg-emerald-800 rounded-xl font-bold transition-colors text-xs flex items-center justify-center gap-1 whitespace-nowrap shrink-0"
                      >
                        <span>Go to Dashboard</span>
                      </Link>
                    </div>
                  ) : coursePending ? (
                    <div className="space-y-1.5">
                      <span className="block text-center text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 py-1 rounded-lg">
                        Pending Verification
                      </span>
                      <Link
                        to="/client-portal"
                        className="w-full py-2.5 px-3 bg-amber-600 text-white hover:bg-amber-700 rounded-xl font-bold transition-colors text-xs flex items-center justify-center gap-1 whitespace-nowrap"
                      >
                        <span>Go to Dashboard</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to={detailPath}
                        className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl font-semibold transition-colors text-xs flex items-center justify-center gap-1 whitespace-nowrap shrink-0"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCourse({
                            id: article.id,
                            title: article.title,
                            description: article.excerpt,
                            price
                          });
                          setIsModalOpen(true);
                        }}
                        className="py-2.5 px-3 bg-slate-900 text-white hover:bg-emerald-700 rounded-xl font-bold transition-colors text-xs cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Buy Now
                      </button>
                    </div>
                  )}

                  <Link
                    to={courseDashboardPath}
                    className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold transition-colors text-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
                    title={`Open Student Dashboard for ${article.title} (${courseDashboardPath})`}
                  >
                    <MonitorPlay className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Student Portal</span>
                  </Link>
                </div>
              </div>
            );
          })}

          {/* 8th Card: Interactive Student LMS Portal & Corporate Compliance Track */}
          <div className="group bg-slate-900 text-white rounded-2xl border border-slate-800 overflow-hidden shadow-md flex flex-col justify-between">
            <div>
              <Link
                to={getAcademyCourseDashboardPath('Interactive LMS Portal: Tax & RJSC Masterclasses')}
                className="block relative h-44 w-full overflow-hidden bg-slate-800"
              >
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800"
                  alt="Interactive LMS Portal: Tax & RJSC Masterclasses"
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/30 to-transparent" />
                <div className="absolute top-3 left-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center backdrop-blur-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
                <span className="absolute bottom-3 right-3 text-[11px] font-mono tabular-nums text-emerald-300 bg-slate-950/80 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  10 Classes · Online LMS
                </span>
              </Link>

              <div className="p-5 pb-0">
                <Link
                  to={getAcademyCourseDashboardPath('Interactive LMS Portal: Tax & RJSC Masterclasses')}
                  className="block"
                >
                  <h3 className="text-base sm:text-lg font-bold text-white hover:text-emerald-300 transition-colors leading-snug">
                    Interactive LMS Portal: Tax &amp; RJSC Masterclasses
                  </h3>
                </Link>
                <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
                  Access sequential video lectures, protected statutory study notes, module quizzes, final examination, and instant PDF certification.
                </p>
              </div>
            </div>

            <div className="p-5 pt-4 mt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Portal Access</span>
                <span className="font-mono tabular-nums font-bold text-emerald-400">
                  Included for Students
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/course/personal-income-tax"
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold transition-colors text-xs flex items-center justify-center gap-1 whitespace-nowrap shrink-0"
                >
                  <span>Syllabus</span>
                </Link>
                <Link
                  to={getAcademyCourseDashboardPath('Interactive LMS Portal: Tax & RJSC Masterclasses')}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors text-xs flex items-center justify-center gap-1 whitespace-nowrap shrink-0"
                >
                  <span>Open LMS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CareerPathways />

      <TrainingFAQ />

      {selectedCourse && (
        <EnrollmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedCourse.title}
          description={selectedCourse.description}
          price={selectedCourse.price}
        />
      )}

      {isAdmissionOpen && admissionCourse && (
        <TrainingAdmissionModal
          isOpen={isAdmissionOpen}
          onClose={() => {
            setIsAdmissionOpen(false);
            setAdmissionCourse(null);
          }}
          courseId={admissionCourse.id}
          courseName={admissionCourse.name}
          userEmail={user?.email || adminUser?.email}
          userName={user?.displayName || adminUser?.name}
        />
      )}

      {certCourse && (
        <CertificateModal
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
          moduleTitle={certCourse.title}
          courseId={certCourse.id}
        />
      )}
    </div>
  );
}
