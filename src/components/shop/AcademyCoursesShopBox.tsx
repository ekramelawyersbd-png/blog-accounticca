import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Video,
  Clock,
  Star,
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
  Check,
  Heart,
  MonitorPlay,
  BookOpen,
  Award,
  Sparkles,
  Layers,
  ChevronRight,
  Calendar,
  FileCheck
} from 'lucide-react';
import { ShopProduct } from '../../data/shopProducts';
import { ProductPurchaseActions } from './ProductPurchaseActions';

interface AcademyCoursesShopBoxProps {
  courses: ShopProduct[];
  onAddToCart: (course: ShopProduct) => void;
  onInstantBuy: (course: ShopProduct) => void;
  isBookmarked: (id: string) => boolean;
  onToggleBookmark: (e: React.MouseEvent, course: ShopProduct) => void;
  addedIds: Record<string, boolean>;
}

type CourseTrack = 'all' | 'tax' | 'vat' | 'corporate' | 'legal' | 'practical';

interface TrackFilterOption {
  id: CourseTrack;
  label: string;
  count: number;
}

export function AcademyCoursesShopBox({
  courses,
  onAddToCart,
  onInstantBuy,
  isBookmarked,
  onToggleBookmark,
  addedIds
}: AcademyCoursesShopBoxProps) {
  const navigate = useNavigate();
  const [selectedTrack, setSelectedTrack] = useState<CourseTrack>('all');

  // Filter courses by track
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      if (selectedTrack === 'all') return true;
      const lowerId = course.id.toLowerCase();
      const lowerTitle = course.title.toLowerCase();

      if (selectedTrack === 'tax') {
        return lowerId.includes('income-tax') || lowerTitle.includes('income tax');
      }
      if (selectedTrack === 'vat') {
        return lowerId.includes('vat') || lowerTitle.includes('vat');
      }
      if (selectedTrack === 'corporate') {
        return lowerId.includes('rjsc') || lowerTitle.includes('rjsc') || lowerTitle.includes('incorporation');
      }
      if (selectedTrack === 'legal') {
        return (
          lowerId.includes('bar-council') ||
          lowerId.includes('high-court') ||
          lowerTitle.includes('bar') ||
          lowerTitle.includes('high court')
        );
      }
      if (selectedTrack === 'practical') {
        return (
          lowerId.includes('accounting') ||
          lowerId.includes('office') ||
          lowerTitle.includes('accounting') ||
          lowerTitle.includes('computer')
        );
      }
      return true;
    });
  }, [courses, selectedTrack]);

  const trackOptions: TrackFilterOption[] = [
    { id: 'all', label: 'All Academy Courses', count: courses.length },
    {
      id: 'tax',
      label: 'Income Tax & e-Return',
      count: courses.filter((c) => c.id.includes('income-tax') || c.title.toLowerCase().includes('income tax')).length
    },
    {
      id: 'vat',
      label: 'VAT & Mushak',
      count: courses.filter((c) => c.id.includes('vat') || c.title.toLowerCase().includes('vat')).length
    },
    {
      id: 'corporate',
      label: 'Corporate & RJSC',
      count: courses.filter((c) => c.id.includes('rjsc') || c.title.toLowerCase().includes('rjsc')).length
    },
    {
      id: 'legal',
      label: 'Bar Council & High Court',
      count: courses.filter((c) => c.id.includes('bar-council') || c.id.includes('high-court')).length
    },
    {
      id: 'practical',
      label: 'Accounting & Digital',
      count: courses.filter((c) => c.id.includes('accounting') || c.id.includes('office')).length
    }
  ];

  return (
    <section
      id="academy-courses-shop-box"
      aria-label="Academy Courses Shop Section"
      className="mb-12 rounded-[2rem] border border-emerald-500/30 bg-gradient-to-b from-white via-slate-50 to-[#edf7f2] p-5 sm:p-8 lg:p-10 shadow-xl shadow-emerald-950/5 relative overflow-hidden"
    >
      {/* Subtle decorative glow accents */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />

      {/* Header Banner */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-emerald-200/80">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-600 text-white shadow-xs">
            <GraduationCap className="w-4 h-4 text-emerald-200" />
            <span>ACADEMY COURSES &amp; LIVE COHORTS</span>
            <span className="text-emerald-300">·</span>
            <span className="text-emerald-100 font-medium">From /training</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight">
            Professional Statutory Certification Programs
          </h2>

          <p className="text-slate-600 text-xs sm:text-sm lg:text-base leading-relaxed">
            Practical legal, income tax (ITA 2023), VAT compliance, RJSC company formation, Bar Council advocacy, and High Court enrollment courses led by Supreme Court advocates. Includes instant shop checkout, interactive LMS access, and verifiable QR-coded certificates.
          </p>
        </div>

        {/* Quick Route Anchors */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            to="/training"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs transition-colors whitespace-nowrap"
            title="Browse full training hub overview"
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Training Hub</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <Link
            to="/student/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-2xs transition-colors whitespace-nowrap"
            title="Access the student LMS portal"
          >
            <MonitorPlay className="w-4 h-4 text-emerald-400" />
            <span>Student LMS</span>
          </Link>

          <Link
            to="/verify-certificate"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs transition-colors whitespace-nowrap"
            title="Verify an issued Academy Certificate"
          >
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Verify Cert</span>
          </Link>
        </div>
      </div>

      {/* Internal Track Filter Switcher */}
      <div className="relative z-10 pt-6 pb-6 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
          Filter Track:
        </span>
        {trackOptions.map((opt) => {
          const isSelected = selectedTrack === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedTrack(opt.id)}
              className={`text-xs px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200/90'
              }`}
            >
              <span>{opt.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isSelected ? 'bg-white text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {opt.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Courses Shop Cards Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredCourses.map((course) => {
          const isAdded = !!addedIds[course.id];
          const isSaved = isBookmarked(course.id);
          const discountPercent =
            course.originalPrice > course.price
              ? Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)
              : 0;

          const isLiveCohort =
            course.id.includes('live') || course.format.toLowerCase().includes('live');

          const detailHref = course.coursePath || `/shop/${course.slug}`;

          return (
            <article
              key={course.id}
              className="group bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-400/80 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl hover:shadow-emerald-950/5"
            >
              {/* Media Preview Header */}
              <div className="relative aspect-16/10 bg-slate-100 overflow-hidden block">
                <Link to={detailHref} className="block w-full h-full">
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </Link>

                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1 items-start z-10">
                  {isLiveCohort ? (
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span>Live Cohort</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-700 text-white shadow-sm flex items-center gap-1">
                      <MonitorPlay className="w-3 h-3 text-emerald-200" />
                      <span>Self-Paced LMS</span>
                    </span>
                  )}

                  {course.badge && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-950/90 text-amber-300 border border-amber-400/30 backdrop-blur-xs">
                      {course.badge}
                    </span>
                  )}
                </div>

                {/* Right Top Heart & Discount */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                  {discountPercent > 0 && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-600 text-white shadow-xs">
                      -{discountPercent}%
                    </span>
                  )}

                  <button
                    type="button"
                    aria-label={
                      isSaved
                        ? `Remove ${course.title} from favorites`
                        : `Save ${course.title} to favorites`
                    }
                    onClick={(e) => onToggleBookmark(e, course)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer shadow-sm ${
                      isSaved
                        ? 'bg-rose-500 text-white ring-2 ring-white/90 scale-105'
                        : 'bg-slate-950/70 text-slate-200 hover:bg-slate-950 hover:text-rose-400 border border-white/20'
                    }`}
                  >
                    <Heart
                      className={`h-4 w-4 ${isSaved ? 'fill-current text-white' : 'text-slate-200'}`}
                    />
                  </button>
                </div>

                {/* Bottom Overlay with Format / Duration */}
                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[10px] text-white bg-slate-950/85 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-800">
                  <span className="font-medium truncate text-slate-200">{course.format}</span>
                  <span className="font-mono text-emerald-300 shrink-0 font-bold">
                    {course.pagesOrFiles.split('•')[0] || 'Certified'}
                  </span>
                </div>
              </div>

              {/* Course Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  {/* Rating & Program Tag */}
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-slate-900">{course.rating}</span>
                      <span className="text-[11px] text-slate-400">({course.reviewsCount})</span>
                    </div>

                    <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      Academy Certified
                    </span>
                  </div>

                  {/* Title */}
                  <Link to={detailHref} className="block group/title">
                    <h3 className="font-bold text-sm sm:text-base text-slate-950 leading-snug group-hover/title:text-emerald-700 transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                  </Link>

                  {/* Cohort Schedule or Live Tag */}
                  {course.cohortSchedule && (
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                      <Calendar className="w-3 h-3 text-rose-600 shrink-0" />
                      <span className="truncate">{course.cohortSchedule}</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                    {course.shortDescription}
                  </p>

                  {/* Features / Modules Checklist */}
                  {course.features && course.features.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                      {course.features.slice(0, 2).map((feat, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 text-[11px] text-slate-600 truncate"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Price Display */}
                <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Course Enrollment Fee
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-black text-slate-950">
                        BDT{' '}
                        {course.price.toLocaleString('en-IN', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })}
                      </span>
                      {course.originalPrice > course.price && (
                        <span className="text-xs line-through text-slate-400 font-medium">
                          BDT{' '}
                          {course.originalPrice.toLocaleString('en-IN', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    to={detailHref}
                    className="text-xs text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-1 p-1 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                    title="View Course Syllabus & Classes"
                  >
                    <span>Syllabus</span>
                    <ArrowRight className="w-3 h-3 text-emerald-600" />
                  </Link>
                </div>
              </div>

              {/* Card Action Buttons (Dynamic Purchase Verification CTA) */}
              <div className="px-5 pb-5 pt-0 space-y-2">
                <ProductPurchaseActions
                  product={course}
                  isAdded={isAdded}
                  onAddToCart={(_, prod) => onAddToCart(prod)}
                  onBuyNow={(_, prod) => onInstantBuy(prod)}
                  variant="course"
                  viewProductHref={detailHref}
                />

                {/* Direct Link to Student LMS Portal */}
                <Link
                  to="/student/dashboard"
                  className="w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <MonitorPlay className="w-3 h-3 text-emerald-400" />
                  <span>Open in Student Learning Portal</span>
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
