import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  Quote, 
  ShieldCheck, 
  TrendingUp, 
  CheckCircle2, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquarePlus,
  X,
  Send,
  Loader2,
  ExternalLink,
  Pause,
  Play,
  LayoutGrid,
  SlidersHorizontal
} from 'lucide-react';
import { 
  TestimonialItem, 
  fetchTestimonials, 
  submitClientTestimonial,
  DEFAULT_TESTIMONIALS 
} from '../services/testimonialService';

interface TestimonialsProps {
  serviceKey?: string;         // e.g. 'automation', 'hr', 'sales', 'outsourced', 'bookkeeping', 'startup'
  serviceCategory?: string;    // e.g. 'Business & Startup', 'Accounting Software'
  title?: string;
  subtitle?: string;
  className?: string;
  variant?: 'carousel' | 'cards' | 'compact';
  autoRotateInterval?: number; // default: 6000ms
}

const SERVICE_FILTER_TABS = [
  { id: 'all', label: 'All Practice Areas' },
  { id: 'automation', label: 'Business Automation' },
  { id: 'hr', label: 'HR & Org Consultancy' },
  { id: 'sales', label: 'Sales & Marketing' },
  { id: 'outsourced', label: 'Outsourced Support' },
  { id: 'bookkeeping', label: 'Accounting & Finance' }
];

// Carousel slide animation variants
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: 'spring' as const, stiffness: 300, damping: 30 },
      opacity: { duration: 0.35 },
      scale: { duration: 0.35 }
    }
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.96,
    transition: {
      x: { type: 'spring' as const, stiffness: 300, damping: 30 },
      opacity: { duration: 0.25 },
      scale: { duration: 0.25 }
    }
  })
};

export function Testimonials({
  serviceKey,
  serviceCategory,
  title = "Client Success Stories & Testimonials",
  subtitle = "Real outcomes achieved by Bangladeshi enterprises, scaleups, and corporations partnering with Accounticca.",
  className = "",
  variant = 'carousel', // Default to animated carousel slider for superior user engagement
  autoRotateInterval = 6000
}: TestimonialsProps) {
  const [activeTab, setActiveTab] = useState<string>(serviceKey || 'all');
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(DEFAULT_TESTIMONIALS);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [viewMode, setViewMode] = useState<'carousel' | 'cards'>(variant === 'cards' ? 'cards' : 'carousel');
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Modal State for submitting a success story
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    clientTitle: '',
    companyName: '',
    serviceKey: serviceKey && serviceKey !== 'all' ? serviceKey : 'automation',
    serviceCategory: serviceCategory || 'Business & Startup',
    rating: 5,
    headline: '',
    story: '',
    metrics: ''
  });

  // Track timer for progress bar animation
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadStories() {
      setLoading(true);
      try {
        const data = await fetchTestimonials(activeTab, serviceCategory);
        if (isMounted) {
          setTestimonials(data);
          setCurrentIndex(0);
          setDirection(1);
        }
      } catch {
        if (isMounted) setTestimonials(DEFAULT_TESTIMONIALS);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadStories();
    return () => { isMounted = false; };
  }, [activeTab, serviceCategory]);

  const filteredTestimonials = testimonials.filter(t => {
    if (activeTab === 'all') return true;
    return t.serviceKey === activeTab;
  });

  const displayList = filteredTestimonials.length > 0 ? filteredTestimonials : testimonials;

  // Safe index bounds
  const safeIndex = displayList.length > 0 ? currentIndex % displayList.length : 0;
  const currentStory = displayList[safeIndex] || displayList[0];

  // Auto-rotation slider logic
  useEffect(() => {
    if (!isAutoPlaying || isHovered || isModalOpen || displayList.length <= 1 || viewMode !== 'carousel') {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % displayList.length);
    }, autoRotateInterval);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isAutoPlaying, isHovered, isModalOpen, displayList.length, viewMode, autoRotateInterval]);

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % displayList.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + displayList.length) % displayList.length);
  };

  const handleSelectStory = (idx: number) => {
    setDirection(idx > safeIndex ? 1 : -1);
    setCurrentIndex(idx);
  };

  const handleSubmitStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.story || !formData.headline) return;

    setSubmitting(true);
    try {
      await submitClientTestimonial({
        clientName: formData.clientName,
        clientTitle: formData.clientTitle,
        companyName: formData.companyName,
        serviceKey: formData.serviceKey,
        serviceCategory: formData.serviceCategory,
        rating: formData.rating,
        headline: formData.headline,
        story: formData.story,
        metrics: formData.metrics,
        verified: false,
        featured: false,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.clientName)}&background=059669&color=fff`
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(false);
        setFormData({
          clientName: '',
          clientTitle: '',
          companyName: '',
          serviceKey: serviceKey || 'automation',
          serviceCategory: serviceCategory || 'Business & Startup',
          rating: 5,
          headline: '',
          story: '',
          metrics: ''
        });
      }, 2500);
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section 
      id="testimonials-section" 
      className={`py-12 md:py-16 bg-gradient-to-b from-slate-50 via-white to-slate-50/50 rounded-3xl border border-slate-200/80 my-10 overflow-hidden relative shadow-sm ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Subtle Background Ambience Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/35 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-100/25 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Verified Client Outcomes
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h2>
            <p className="mt-2 text-base text-slate-600 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* View Mode Toggle Button */}
            <div className="hidden sm:inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('carousel')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'carousel' 
                    ? 'bg-white text-emerald-700 font-bold shadow-xs' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Slider view"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Slider</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'cards' 
                    ? 'bg-white text-emerald-700 font-bold shadow-xs' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
            </div>

            <button
              id="submit-testimonial-btn"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:text-emerald-700 hover:border-emerald-400 font-semibold text-sm transition-all shadow-sm hover:shadow"
            >
              <MessageSquarePlus className="w-4 h-4 text-emerald-600" />
              <span>Share Your Story</span>
            </button>

            <Link
              id="book-consultancy-cta-btn"
              to="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 font-semibold text-sm transition-all shadow-md hover:shadow-emerald-600/20"
            >
              <span>Consult an Expert</span>
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        {(!serviceKey || serviceKey === 'all') && (
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
            {SERVICE_FILTER_TABS.map(tab => (
              <button
                key={tab.id}
                id={`filter-tab-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentIndex(0);
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Content Body */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="ml-3 text-slate-500 font-medium">Loading client experiences...</span>
          </div>
        ) : viewMode === 'carousel' && displayList.length > 0 ? (
          /* ========================================================================= */
          /* FRAMER MOTION CAROUSEL SLIDER WITH AUTOMATIC ROTATION                     */
          /* ========================================================================= */
          <div className="relative">
            {/* Top Auto-Play Status & Controls */}
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  Story <span className="text-emerald-700 font-bold">{safeIndex + 1}</span> of {displayList.length}
                </span>
                <span className="text-slate-300">•</span>
                <button
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer"
                  title={isAutoPlaying ? "Pause auto-rotation" : "Resume auto-rotation"}
                >
                  {isAutoPlaying ? (
                    <>
                      <Pause className="w-3 h-3 text-emerald-600" />
                      <span>Auto-rotating ({Math.round(autoRotateInterval / 1000)}s)</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-400">Paused</span>
                    </>
                  )}
                </button>
              </div>

              {/* Prev / Next Slide Nav Buttons */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrev} 
                  id="testimonial-prev-btn"
                  className="p-2.5 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all shadow-xs"
                  aria-label="Previous client story"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleNext} 
                  id="testimonial-next-btn"
                  className="p-2.5 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all shadow-xs"
                  aria-label="Next client story"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Slider Container with AnimatePresence */}
            <div className="relative bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden min-h-[420px] sm:min-h-[380px] flex flex-col justify-between">
              
              {/* Subtle Top Linear Progress Bar when auto-playing */}
              {isAutoPlaying && !isHovered && (
                <div className="w-full bg-slate-100 h-1 overflow-hidden">
                  <motion.div 
                    key={safeIndex}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: autoRotateInterval / 1000, ease: "linear" }}
                    className="h-full bg-emerald-500"
                  />
                </div>
              )}

              {/* Animated Slide Content */}
              <div className="p-6 sm:p-10 lg:p-12 relative flex-1 flex flex-col justify-between">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  <motion.div
                    key={currentStory.id || safeIndex}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="w-full flex-1 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar: Stars + Category + Verification Tag */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                        <div className="flex items-center gap-1.5 text-amber-400">
                          {[...Array(currentStory.rating)].map((_, i) => (
                            <Star key={i} className="w-5 h-5 fill-amber-400" />
                          ))}
                          <span className="text-xs font-bold text-slate-700 ml-1.5">5.0 Star Rating</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200/80">
                            {currentStory.serviceCategory}
                          </span>
                        </div>
                      </div>

                      {/* Headline */}
                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 mb-4 leading-snug tracking-tight">
                        "{currentStory.headline}"
                      </h3>

                      {/* Story Narrative */}
                      <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-6 font-normal">
                        "{currentStory.story}"
                      </p>
                    </div>

                    <div>
                      {/* Measurable Performance Metrics */}
                      {currentStory.metrics && (
                        <div className="inline-flex items-center gap-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-emerald-200/90 mb-6 shadow-xs">
                          <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Verified Impact: {currentStory.metrics}</span>
                        </div>
                      )}

                      {/* Client Attribution Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-4">
                          <img 
                            src={currentStory.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentStory.clientName)}&background=059669&color=fff`} 
                            alt={currentStory.clientName} 
                            className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-sm shrink-0"
                          />
                          <div>
                            <h4 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                              {currentStory.clientName}
                              {currentStory.verified && (
                                <span title="Verified Client" className="inline-flex items-center">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                </span>
                              )}
                            </h4>
                            <p className="text-xs sm:text-sm text-slate-500">
                              {currentStory.clientTitle} • <span className="font-semibold text-slate-800">{currentStory.companyName}</span>
                            </p>
                          </div>
                        </div>

                        {/* Subtle Quote Icon Accent */}
                        <Quote className="w-12 h-12 text-slate-200/80 hidden sm:block" />
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bottom Carousel Indicator Dots & Quick Jump Navigation */}
              <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {displayList.map((story, idx) => (
                    <button
                      key={story.id || idx}
                      onClick={() => handleSelectStory(idx)}
                      className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === safeIndex 
                          ? 'w-8 bg-emerald-600' 
                          : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                      }`}
                      aria-label={`Jump to story ${idx + 1}: ${story.clientName}`}
                      title={`${story.clientName} - ${story.companyName}`}
                    />
                  ))}
                </div>

                <div className="text-xs text-slate-500 hidden md:block">
                  Hovering pauses rotation • Click dots or arrows to navigate
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* STATIC RESPONSIVE MULTI-CARD GRID MODE                                    */
          /* ========================================================================= */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayList.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                <Quote className="absolute top-4 right-4 w-12 h-12 text-slate-100 group-hover:text-emerald-50 transition-colors pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                      {item.serviceCategory}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-3 leading-snug group-hover:text-emerald-950 transition-colors">
                    "{item.headline}"
                  </h3>

                  <p className="text-slate-600 text-sm leading-relaxed mb-5">
                    {item.story}
                  </p>
                </div>

                <div>
                  {item.metrics && (
                    <div className="mb-5 flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-800">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="line-clamp-1">{item.metrics}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <img 
                      src={item.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.clientName)}&background=059669&color=fff`} 
                      alt={item.clientName} 
                      className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0" 
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {item.clientName}
                        </h4>
                        {item.verified && (
                          <span title="Verified Client" className="inline-flex items-center shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {item.clientTitle} • <span className="text-slate-700 font-medium">{item.companyName}</span>
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Bottom Social Proof Metrics Bar */}
        <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">500+</p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Enterprises & Startups Advised</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">98.4%</p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Statutory & Audit Compliance Rate</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">15+ Yrs</p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Corporate Advisory Heritage</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">4.9 / 5.0</p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Average Client Trust Score</p>
          </div>
        </div>

      </div>

      {/* Submit Testimonial Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Client Collaboration Story
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Share Your Experience</h3>
            <p className="text-sm text-slate-600 mb-6">
              Help other Bangladeshi businesses understand the operational and financial impact of Accounticca’s consultancy services.
            </p>

            {submitSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center my-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-emerald-900 mb-1">Thank You For Your Feedback!</h4>
                <p className="text-sm text-emerald-700">
                  Your review has been submitted for verification. We appreciate your partnership with Accounticca.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitStory} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Your Full Name *</label>
                    <input 
                      type="text"
                      required
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      placeholder="e.g. Tanvir Rahman"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Your Title / Role *</label>
                    <input 
                      type="text"
                      required
                      value={formData.clientTitle}
                      onChange={(e) => setFormData({ ...formData, clientTitle: e.target.value })}
                      placeholder="e.g. Managing Director"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Company / Organization *</label>
                    <input 
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="e.g. Acme Holdings Ltd."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Consultancy Service *</label>
                    <select
                      value={formData.serviceKey}
                      onChange={(e) => setFormData({ ...formData, serviceKey: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                    >
                      <option value="automation">Business Automation & ERP</option>
                      <option value="hr">HR & Organization Consultancy</option>
                      <option value="sales">Sales & Marketing Strategy</option>
                      <option value="outsourced">Outsourced Business Support</option>
                      <option value="bookkeeping">Bookkeeping & Accounting</option>
                      <option value="startup">Startup & Company Formation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Headline Summary *</label>
                  <input 
                    type="text"
                    required
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    placeholder="e.g. Reconstructed 2 years of backlog accounts in 30 days"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Detailed Story & Experience *</label>
                  <textarea 
                    required
                    rows={3}
                    value={formData.story}
                    onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                    placeholder="Describe how Accounticca assisted your company, what challenges were solved, and the overall outcome..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Measurable Result / Metrics (Optional)</label>
                  <input 
                    type="text"
                    value={formData.metrics}
                    onChange={(e) => setFormData({ ...formData, metrics: e.target.value })}
                    placeholder="e.g. 40% reduction in reporting delay, BDT 1.2M saved in penalties"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Publish Review</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
