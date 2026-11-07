import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  PenTool, 
  MessageSquare, 
  Star, 
  Search, 
  ThumbsUp, 
  MessageCircle, 
  HelpCircle, 
  Award, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Flame, 
  TrendingUp, 
  Briefcase, 
  UserPlus, 
  UserCheck, 
  Calendar, 
  Filter, 
  Tag, 
  Clock, 
  Sparkles, 
  ChevronRight,
  ExternalLink,
  ChevronDown,
  Send,
  Building2,
  Receipt,
  Coins,
  Globe,
  Linkedin,
  Mail,
  Phone
} from 'lucide-react';
import { 
  Expert, 
  Question, 
  EXPERT_CATEGORIES, 
  INITIAL_EXPERTS, 
  TRENDING_DISCUSSIONS, 
  TOP_CONTRIBUTORS_MONTH, 
  INITIAL_QUESTIONS 
} from '../data/communityData';
import { ExpertProfileModal } from '../components/community/ExpertProfileModal';
import { AskQuestionModal } from '../components/community/AskQuestionModal';
import { BookConsultationModal } from '../components/community/BookConsultationModal';
import { ExpertApplicationModal } from '../components/community/ExpertApplicationModal';
import { PublishArticleModal } from '../components/community/PublishArticleModal';
import { buildAppointmentUrl, APPOINTMENT_BASE_URL } from '../utils/appointmentRedirect';
import { SEO } from '../components/SEO';

interface CommunityProps {
  initialTab?: 'experts' | 'discussions';
}

export function Community({ initialTab }: CommunityProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const queryTab = searchParams.get('tab') || initialTab;
  const shouldOpenAsk = searchParams.get('ask') === 'true';

  // Refs for smooth scrolling
  const expertsSectionRef = useRef<HTMLDivElement>(null);
  const discussionsSectionRef = useRef<HTMLDivElement>(null);
  const rankingsSectionRef = useRef<HTMLDivElement>(null);

  // State
  const [experts, setExperts] = useState<Expert[]>(INITIAL_EXPERTS);
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [qaFilter, setQaFilter] = useState<'latest' | 'most-answered' | 'trending' | 'unanswered'>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [upvotedMap, setUpvotedMap] = useState<Record<string, boolean>>({});
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  // Modals
  const [selectedExpertForModal, setSelectedExpertForModal] = useState<Expert | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedExpertForBooking, setSelectedExpertForBooking] = useState<Expert | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [targetedExpertForAsk, setTargetedExpertForAsk] = useState<string | undefined>();
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // Handle URL tabs and queries on mount
  useEffect(() => {
    if (shouldOpenAsk) {
      setIsAskModalOpen(true);
    }
    if (queryTab === 'experts') {
      setTimeout(() => {
        expertsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else if (queryTab === 'discussions') {
      setTimeout(() => {
        discussionsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, [queryTab, shouldOpenAsk]);

  // Toggle follow
  const handleToggleFollow = (expertId: string) => {
    setFollowingMap(prev => ({
      ...prev,
      [expertId]: !prev[expertId]
    }));
  };

  // Toggle upvote on question
  const handleToggleUpvote = (questionId: string) => {
    const isUpvoted = !!upvotedMap[questionId];
    setUpvotedMap(prev => ({ ...prev, [questionId]: !isUpvoted }));
    setQuestions(prev =>
      prev.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            upvotes: isUpvoted ? q.upvotes - 1 : q.upvotes + 1
          };
        }
        return q;
      })
    );
  };

  // Submit new question
  const handleAddQuestion = (newQ: Partial<Question>) => {
    const created: Question = {
      id: `q-${Date.now()}`,
      title: newQ.title || 'Untitled Inquiry',
      content: newQ.content || '',
      author: newQ.author || { name: 'Community Member', role: 'Business Owner' },
      tags: newQ.tags || ['Legal & Tax'],
      category: newQ.category || 'Income Tax',
      answersCount: 0,
      upvotes: 1,
      views: 12,
      time: 'Just now',
      timestamp: Date.now(),
      lastAnsweredTime: 'Awaiting answers',
      isAnsweredByExpert: false,
      answers: []
    };
    setQuestions(prev => [created, ...prev]);
    setExpandedQuestionId(created.id);
  };

  // Submit quick answer inside accordion
  const handlePostReply = (questionId: string) => {
    const text = replyInputs[questionId]?.trim();
    if (!text) return;

    setQuestions(prev =>
      prev.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            answersCount: q.answersCount + 1,
            lastAnsweredTime: 'Just now',
            answers: [
              ...q.answers,
              {
                id: `ans-${Date.now()}`,
                author: {
                  name: 'Practitioner Contributor',
                  role: 'Corporate Advisor',
                  badge: '✓ Verified Contributor',
                  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
                  rating: 4.8
                },
                content: text,
                upvotes: 1,
                time: 'Just now',
                isVerifiedAnswer: true
              }
            ]
          };
        }
        return q;
      })
    );

    setReplyInputs(prev => ({ ...prev, [questionId]: '' }));
  };

  // Filtered experts (3 boxes available, remaining open in a new tab)
  const filteredExperts = experts.filter(exp => {
    if (selectedCategoryFilter === 'all') return true;
    return exp.category === selectedCategoryFilter;
  });
  const displayedExperts = filteredExperts.slice(0, 3);
  const remainingExpertsCount = Math.max(0, filteredExperts.length - 3);

  // Filtered and sorted questions
  const filteredQuestions = questions
    .filter(q => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        q.title.toLowerCase().includes(query) ||
        q.content.toLowerCase().includes(query) ||
        q.tags.some(t => t.toLowerCase().includes(query)) ||
        q.author.name.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (qaFilter === 'most-answered') {
        return b.answersCount - a.answersCount;
      }
      if (qaFilter === 'trending') {
        return b.upvotes - a.upvotes;
      }
      if (qaFilter === 'unanswered') {
        return a.answersCount - b.answersCount;
      }
      return b.timestamp - a.timestamp;
    });

  return (
    <div className="bg-slate-50 min-h-screen">
      <SEO
        title={
          initialTab === 'experts'
            ? 'Verified Legal, Tax & Accounting Experts Directory | Accounticca Community'
            : initialTab === 'discussions'
            ? 'Legal, Tax & Corporate Compliance Q&A Forum | Accounticca Community'
            : 'Professional Network for Legal, Tax & Business Experts | Accounticca & E-Lawyers'
        }
        description="Connect with verified Supreme Court Advocates, Chartered Accountants, Income Tax Lawyers, and RJSC Consultants across Bangladesh."
        canonicalUrl={
          initialTab === 'experts'
            ? '/experts'
            : initialTab === 'discussions'
            ? '/discussions'
            : '/community'
        }
      />
      {/* 1. Hero Section (Community Landing) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-emerald-50/40 to-slate-100/70 text-slate-900 pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80">
        {/* Subtle decorative mesh background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),rgba(255,255,255,0))] pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-[50px] text-center relative z-10">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-bold mb-6 shadow-2xs">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Accounticca Verified Professional Network</span>
          </div>

          {/* New Hero Copy */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.15]">
            Bangladesh's Professional Network for Legal, Tax & Business Experts
          </h1>
          <p className="text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-10 font-normal">
            Connect with lawyers, accountants, tax consultants, and entrepreneurs. Share knowledge, solve problems, and build your professional reputation.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setIsApplicationModalOpen(true)}
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-sm sm:text-base transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-5 h-5 text-white" />
              <span>Join Community</span>
            </button>
            <button
              onClick={() => expertsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-950 border border-slate-300 rounded-2xl font-bold text-sm sm:text-base transition-all shadow-2xs hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Explore Experts</span>
            </button>
          </div>

          <div className="mb-16">
            <Link
              to="/community/career"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-emerald-300 hover:text-white border border-slate-800 hover:bg-slate-800 text-xs sm:text-sm font-bold shadow-sm transition-all"
            >
              <Briefcase className="w-4 h-4 text-emerald-400" />
              <span>Explore E-Lawyers Career &amp; Job Openings</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Community Statistics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-8 border-t border-slate-200">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs text-center hover:border-emerald-300 transition-colors">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-600 mb-1">10,000+</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-600">Professionals</div>
            </div>
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs text-center hover:border-emerald-300 transition-colors">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-teal-600 mb-1">2,500+</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-600">Discussions</div>
            </div>
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs text-center hover:border-emerald-300 transition-colors">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-amber-600 mb-1">500+</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-600">Expert Contributors</div>
            </div>
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs text-center hover:border-emerald-300 transition-colors">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-blue-600 mb-1">50+</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-600">Industry Topics</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        
        {/* 2. Feature Cards Improvement (Action-Focused) */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Card 1: Publish Knowledge */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">
                  ✍️
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">
                  Publish Knowledge
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  Share legal, tax and business insights. Build your authority and professional profile across Bangladesh.
                </p>
              </div>
              <button
                onClick={() => setIsPublishModalOpen(true)}
                className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-800 transition-colors pt-2 border-t border-slate-100 mt-auto"
              >
                <span>Start Writing</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Card 2: Get Expert Answers */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">
                  💬
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors">
                  Get Expert Answers
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  Ask questions, discuss regulations, and receive guidance from verified professionals.
                </p>
              </div>
              <button
                onClick={() => {
                  setTargetedExpertForAsk(undefined);
                  setIsAskModalOpen(true);
                }}
                className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-800 transition-colors pt-2 border-t border-slate-100 mt-auto"
              >
                <span>Ask Question</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Card 3: Build Your Reputation */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">
                  🏆
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-3 group-hover:text-amber-700 transition-colors">
                  Build Your Reputation
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  Earn badges, gain recognition, and become a trusted industry contributor in legal, audit, and tax sectors.
                </p>
              </div>
              <button
                onClick={() => rankingsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 hover:text-amber-800 transition-colors pt-2 border-t border-slate-100 mt-auto"
              >
                <span>View Rankings</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </section>

        {/* 4. Find Experts By Category Section */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Specialized Advisory</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Find Experts By Category
              </h2>
            </div>
            {selectedCategoryFilter !== 'all' && (
              <button
                onClick={() => setSelectedCategoryFilter('all')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 self-start sm:self-auto"
              >
                Reset Filter (Show All)
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {EXPERT_CATEGORIES.map(cat => {
              const isSelected = selectedCategoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryFilter(isSelected ? 'all' : cat.id)}
                  className={`p-5 rounded-[1.5rem] border text-left transition-all duration-300 flex flex-col justify-between group ${
                    isSelected
                      ? 'bg-emerald-800 text-white border-emerald-700 shadow-lg scale-[1.02]'
                      : 'bg-white hover:bg-slate-50 border-slate-200/80 hover:border-emerald-300 shadow-xs'
                  }`}
                >
                  <div className="text-2xl sm:text-3xl mb-3">{cat.icon}</div>
                  <div>
                    <h3 className={`text-sm sm:text-base font-bold leading-tight mb-1 ${isSelected ? 'text-white' : 'text-slate-900 group-hover:text-emerald-700'}`}>
                      {cat.title}
                    </h3>
                    <span className={`text-xs font-semibold ${isSelected ? 'text-emerald-200' : 'text-emerald-700'}`}>
                      {cat.count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. Expert Contributors Section (Verified Badges & Credibility) */}
        <section ref={expertsSectionRef} id="experts-section" className="scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 mb-1">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider">High Trust Network • Synced with E-Lawyers Team</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Top Expert Contributors & Advisory Panel
              </h2>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Direct access to our verified advocates, chartered accountants, and tax advisors from the E-Lawyers legal & corporate team.
              </p>
            </div>
            
            <div className="flex items-center flex-wrap gap-2.5">
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                Showing {displayedExperts.length} of {filteredExperts.length} experts
              </span>
              {remainingExpertsCount > 0 && (
                <a
                  href="/team"
                  target="_blank"
                  rel="noopener noreferrer"
                  id="header-open-remaining-experts-btn"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors"
                  title="Open remaining experts in a new tab"
                >
                  <span>Remaining ({remainingExpertsCount}) in New Tab</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              )}
              {selectedCategoryFilter !== 'all' && (
                <button
                  onClick={() => setSelectedCategoryFilter('all')}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Show All Categories
                </button>
              )}
              <a
                href={APPOINTMENT_BASE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Firm Consultation</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
              <button
                onClick={() => setIsApplicationModalOpen(true)}
                className="px-3.5 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors"
              >
                Become an Expert
              </button>
            </div>
          </div>

          {filteredExperts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">No experts in this filter</h3>
              <p className="text-sm text-slate-500 mb-4">View our full roster of legal, tax, and audit specialists.</p>
              <button
                onClick={() => setSelectedCategoryFilter('all')}
                className="px-4 py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl hover:bg-emerald-800 transition-colors"
              >
                Show All {INITIAL_EXPERTS.length} Team Members
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedExperts.map(expert => {
                const isFollowing = !!followingMap[expert.id];
                return (
                  <div 
                    key={expert.id}
                    className="bg-white rounded-[2rem] border border-slate-200/90 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                  >
                    {/* Card Header with Avatar & Verification */}
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="relative">
                          <img 
                            src={expert.avatar} 
                            alt={expert.name} 
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-100 shadow-sm bg-slate-100"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name)}&background=047857&color=fff&size=200`;
                            }}
                          />
                          <span 
                            className="absolute -bottom-1 -right-1 p-1 bg-emerald-600 text-white rounded-lg shadow-sm"
                            title="Verified Professional"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        </div>

                        {/* Follow Button */}
                        <button
                          onClick={() => handleToggleFollow(expert.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            isFollowing
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-700'
                          }`}
                        >
                          {isFollowing ? '✓ Following' : '+ Follow'}
                        </button>
                      </div>

                      {/* Name & Credentials */}
                      <div className="mb-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {expert.name}
                          </h3>
                        </div>
                        <p className="text-emerald-800 font-bold text-xs sm:text-sm line-clamp-1">
                          {expert.role}
                        </p>
                        
                        {/* Expert Verification Badge */}
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-xs font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{expert.verificationBadge}</span>
                        </div>
                      </div>

                      {/* Short Bio */}
                      {expert.bio && (
                        <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                          {expert.bio}
                        </p>
                      )}

                      {/* Experience & Stats line */}
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium py-2 border-y border-slate-100 mb-3">
                        <span className="flex items-center gap-1 text-slate-700 font-semibold shrink-0">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {expert.experience}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700 truncate">
                          {expert.answersCount} Answers
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-amber-600 font-bold shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          {expert.rating.toFixed(1)}
                        </span>
                      </div>

                      {/* Specialization pills */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {expert.specialization.slice(0, 3).map(topic => (
                          <span 
                            key={topic}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-md truncate max-w-[140px]"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>

                      {/* Social & Contact icons if available from Team */}
                      {(expert.whatsapp || expert.linkedin || expert.email || expert.phone) && (
                        <div className="flex items-center gap-1.5 mb-4 pt-1">
                          {expert.whatsapp && (
                            <a
                              href={buildAppointmentUrl({ lawyer: expert.name, service: expert.role, source: 'Community Card WhatsApp Inquiry' })}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title={`Schedule WhatsApp consultation with ${expert.name}`}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                          {expert.linkedin && (
                            <a
                              href={expert.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-[#0077b5] hover:bg-blue-50 rounded-lg transition-colors"
                              title="LinkedIn Profile"
                            >
                              <Linkedin className="w-4 h-4" />
                            </a>
                          )}
                          {expert.email && (
                            <a
                              href={buildAppointmentUrl({ lawyer: expert.name, service: expert.role, source: 'Community Card Email' })}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title={`Email consultation inquiry for ${expert.name}`}
                            >
                              <Mail className="w-4 h-4" />
                            </a>
                          )}
                          {expert.phone && (
                            <a
                              href={buildAppointmentUrl({ lawyer: expert.name, service: expert.role, source: 'Community Card Phone' })}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title={`Schedule phone consultation with ${expert.name}`}
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Bottom CTA Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100 mt-auto">
                      <button
                        onClick={() => {
                          setSelectedExpertForModal(expert);
                          setIsProfileModalOpen(true);
                        }}
                        className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors text-center"
                      >
                        View Profile
                      </button>
                      <a
                        href={buildAppointmentUrl({ lawyer: expert.name, service: expert.role, source: 'Community Card Button' })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors text-center shadow-xs inline-flex items-center justify-center gap-1"
                      >
                        <span>Book Consult</span>
                        <ExternalLink className="w-3 h-3 opacity-75" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Remaining Experts Action Card - Opens full team in New Tab */}
            {remainingExpertsCount > 0 && (
              <div 
                id="remaining-experts-card" 
                className="mt-8 p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-[2rem] border border-slate-700/60 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 text-white"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 shadow-inner">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider mb-1">
                      <span>3 Experts Displayed Above</span>
                    </div>
                    <h4 className="font-extrabold text-lg sm:text-xl text-white">
                      Access All Remaining {remainingExpertsCount} Panel Specialists
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                      Click below to open the complete directory of Supreme Court advocates, chartered accountants, and corporate legal advisors in a new tab.
                    </p>
                  </div>
                </div>
                <a
                  href="/team"
                  target="_blank"
                  rel="noopener noreferrer"
                  id="open-remaining-experts-btn"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs sm:text-sm transition-all shadow-lg hover:shadow-emerald-500/25 shrink-0 whitespace-nowrap"
                >
                  <span>Open Remaining ({remainingExpertsCount}) in New Tab</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </>
        )}
      </section>

        {/* 6. Featured Discussions / Trending Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-amber-500/10 text-amber-600 rounded-lg">
              <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Trending Discussions</h3>
              <p className="text-xs text-slate-500">Topics with the highest practitioner engagement this week</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TRENDING_DISCUSSIONS.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => {
                  setSearchQuery(item.tag);
                  discussionsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      🔥 Hot Topic
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">{item.time}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug mb-3">
                    {item.title}
                  </h4>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    {item.participantsCount} discussing
                  </span>
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {item.expertRepliesCount} Expert replies
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Professional Q&A Section (Stack Overflow + LinkedIn style) */}
        <section ref={discussionsSectionRef} id="discussions-section" className="scroll-mt-24">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 mb-1">
                <HelpCircle className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Stack Overflow for BD Law & Tax</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Professional Q&A & Regulatory Discussions
              </h2>
            </div>

            {/* Top Search & Ask Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  inputMode="search"
                  autoComplete="off"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions or topics..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 shadow-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  setTargetedExpertForAsk(undefined);
                  setIsAskModalOpen(true);
                }}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <HelpCircle className="w-4 h-4" />
                Ask a Question
              </button>
            </div>
          </div>

          {/* Stack Overflow Filter Tabs */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 border-b border-slate-200 mb-6">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setQaFilter('latest')}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                  qaFilter === 'latest'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Latest
              </button>
              <button
                onClick={() => setQaFilter('most-answered')}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                  qaFilter === 'most-answered'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Most Answered
              </button>
              <button
                onClick={() => setQaFilter('trending')}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                  qaFilter === 'trending'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Trending
              </button>
              <button
                onClick={() => setQaFilter('unanswered')}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                  qaFilter === 'unanswered'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Unanswered
              </button>
            </div>

            <span className="text-xs text-slate-400 font-semibold hidden md:block">
              {filteredQuestions.length} discussions recorded
            </span>
          </div>

          {/* Question List */}
          <div className="space-y-4">
            {filteredQuestions.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800 mb-1">No matching questions found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  Be the first to post an inquiry regarding this legal or fiscal issue.
                </p>
                <button
                  onClick={() => setIsAskModalOpen(true)}
                  className="px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl"
                >
                  Ask This Question Now
                </button>
              </div>
            ) : (
              filteredQuestions.map(q => {
                const isExpanded = expandedQuestionId === q.id;
                const isUpvoted = !!upvotedMap[q.id];

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-[1.75rem] border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row gap-5 items-start">
                        {/* Vote and Answers Pill (Desktop) */}
                        <div className="hidden md:flex flex-col items-center gap-3 shrink-0 min-w-[70px]">
                          <button
                            onClick={() => handleToggleUpvote(q.id)}
                            className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                              isUpvoted
                                ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200'
                                : 'text-slate-400 hover:text-emerald-700 hover:bg-slate-50'
                            }`}
                            title="Helpful vote"
                          >
                            <ThumbsUp className="w-4 h-4 mb-0.5" />
                            <span className="text-xs font-extrabold">{q.upvotes}</span>
                            <span className="text-[9px] uppercase tracking-tighter text-slate-400">Votes</span>
                          </button>

                          <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50 text-slate-600 min-w-[64px]">
                            <MessageCircle className="w-4 h-4 mb-0.5 text-emerald-600" />
                            <span className="text-xs font-extrabold text-slate-900">{q.answersCount}</span>
                            <span className="text-[9px] uppercase tracking-tighter text-slate-400">Answers</span>
                          </div>
                        </div>

                        {/* Question Content */}
                        <div className="flex-1 min-w-0">
                          {/* Topics pills */}
                          <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                            {q.tags.map(tag => (
                              <span
                                key={tag}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSearchQuery(tag);
                                }}
                                className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 hover:bg-emerald-100 cursor-pointer px-2.5 py-1 rounded-md border border-emerald-200/70 transition-colors"
                              >
                                {tag}
                              </span>
                            ))}
                            {q.isAnsweredByExpert && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                Expert Verified Answer
                              </span>
                            )}
                          </div>

                          {/* Question Headline */}
                          <h3
                            onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                            className="text-lg font-bold text-slate-900 hover:text-emerald-700 cursor-pointer transition-colors leading-snug mb-2"
                          >
                            {q.title}
                          </h3>

                          {/* Preview snippet */}
                          <p className="text-slate-600 text-sm leading-relaxed mb-4">
                            {q.content}
                          </p>

                          {/* Asked by & Stats Footer */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                                {q.author.name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900">{q.author.name}</span>
                                <span className="text-slate-400 mx-1.5">•</span>
                                <span className="text-slate-500 font-medium">{q.author.role}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-slate-400 font-medium">
                              <span>Last active: {q.lastAnsweredTime}</span>
                              <span>•</span>
                              <button
                                onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                                className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                              >
                                {isExpanded ? 'Hide Discussion' : `View ${q.answersCount} Answers`}
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                          </div>

                          {/* Mobile Vote row */}
                          <div className="flex md:hidden items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
                            <button
                              onClick={() => handleToggleUpvote(q.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                                isUpvoted ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-500 bg-slate-50'
                              }`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>{q.upvotes} Helpful Votes</span>
                            </button>
                            <span className="font-bold text-emerald-700">
                              {q.answersCount} Answers
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Answers & Discussion Area */}
                    {isExpanded && (
                      <div className="bg-slate-50/80 p-6 border-t border-slate-200/80 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Answers & Regulatory Advisory ({q.answers.length})
                          </h4>
                          <span className="text-xs text-slate-400">
                            Citations under BD Gazette & SROs
                          </span>
                        </div>

                        {q.answers.length === 0 ? (
                          <div className="p-4 bg-white rounded-xl text-center border border-slate-200/60 text-xs text-slate-500">
                            No answers posted yet. Have knowledge on this regulatory issue? Add an answer below.
                          </div>
                        ) : (
                          q.answers.map(ans => (
                            <div
                              key={ans.id}
                              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs"
                            >
                              <div className="flex items-center justify-between gap-2 mb-2.5">
                                <div className="flex items-center gap-2.5">
                                  <img 
                                    src={ans.author.avatar} 
                                    alt={ans.author.name} 
                                    className="w-8 h-8 rounded-full object-cover border border-emerald-200"
                                  />
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-bold text-slate-900">{ans.author.name}</span>
                                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                        {ans.author.badge}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-slate-500">{ans.author.role}</span>
                                  </div>
                                </div>
                                <span className="text-[11px] text-slate-400">{ans.time}</span>
                              </div>

                              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                {ans.content}
                              </p>

                              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[11px]">
                                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  Statutory Compliance Verified
                                </span>
                                <button className="flex items-center gap-1 text-slate-500 hover:text-emerald-700">
                                  <ThumbsUp className="w-3 h-3" />
                                  <span>Helpful ({ans.upvotes})</span>
                                </button>
                              </div>
                            </div>
                          ))
                        )}

                        {/* Quick Answer Form */}
                        <div className="pt-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Post an Expert / Peer Response
                          </label>
                          <div className="flex gap-2">
                            <textarea
                              rows={2}
                              value={replyInputs[q.id] || ''}
                              onChange={(e) => setReplyInputs(prev => ({ ...prev, [q.id]: e.target.value }))}
                              placeholder="Provide advice, citing statutory sections or practice rules..."
                              className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                            />
                            <button
                              onClick={() => handlePostReply(q.id)}
                              className="px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 shrink-0 self-end py-3"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Answer</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* 7. Contributor Ranking System (Gamification Leaderboard) */}
        <section ref={rankingsSectionRef} id="rankings-section" className="scroll-mt-24">
          <div className="bg-white rounded-[2rem] border border-slate-200/80 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl">
                  🏆
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    Top Contributors This Month
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Ranked by peer upvotes, verified answers, and statutory compliance contributions
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full self-start sm:self-auto">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                Updated Daily
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TOP_CONTRIBUTORS_MONTH.map(contributor => (
                <div
                  key={contributor.name}
                  className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-emerald-300 hover:shadow-md transition-all text-center flex flex-col items-center justify-between group"
                >
                  <div className="w-full">
                    {/* Rank Badge */}
                    <div className="flex justify-between items-center w-full mb-2">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${contributor.tierColor}`}>
                        {contributor.tierBadge}
                      </span>
                      <span className="text-xs font-extrabold text-slate-400">
                        #{contributor.rank}
                      </span>
                    </div>

                    {/* Avatar */}
                    <div className="relative my-3">
                      <img 
                        src={contributor.avatar} 
                        alt={contributor.name} 
                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm mx-auto"
                      />
                    </div>

                    <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {contributor.name}
                    </h4>
                    <p className="text-xs text-emerald-800 font-semibold mb-1">
                      {contributor.role}
                    </p>
                    <p className="text-[10px] font-medium text-slate-500 mb-3">
                      {contributor.badge}
                    </p>
                  </div>

                  <div className="w-full pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <div className="text-left">
                      <div className="font-extrabold text-slate-900">{contributor.helpfulAnswers}</div>
                      <div className="text-[10px] text-slate-400">Helpful Answers</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-emerald-700">{contributor.reputationPoints}</div>
                      <div className="text-[10px] text-slate-400">Rep Points</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Improved Final CTA Section */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-emerald-950 via-slate-950 to-emerald-950 p-8 sm:p-12 text-white border border-emerald-800/40 text-center shadow-2xl">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-emerald-500/30">
              <Users className="w-7 h-7" />
            </div>

            {/* New CTA Copy */}
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4 text-white">
              Become a Trusted Professional Voice in Bangladesh
            </h2>
            <p className="text-emerald-100/80 text-sm sm:text-base leading-relaxed mb-8 font-normal">
              Publish articles, answer industry questions, and connect with thousands of professionals.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setIsApplicationModalOpen(true)}
                className="w-full sm:w-auto px-7 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-extrabold text-sm transition-all shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5"
              >
                Create Expert Profile
              </button>
              <button
                onClick={() => discussionsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
              >
                Join Discussions
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* Interactive Modals */}
      <ExpertProfileModal
        expert={selectedExpertForModal}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        isFollowing={selectedExpertForModal ? !!followingMap[selectedExpertForModal.id] : false}
        onToggleFollow={handleToggleFollow}
        onBookConsultation={(exp) => {
          setIsProfileModalOpen(false);
          setSelectedExpertForBooking(exp);
          setIsBookingModalOpen(true);
        }}
        onAskQuestionToExpert={(exp) => {
          setIsProfileModalOpen(false);
          setTargetedExpertForAsk(exp.name);
          setIsAskModalOpen(true);
        }}
      />

      <BookConsultationModal
        expert={selectedExpertForBooking}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />

      <AskQuestionModal
        isOpen={isAskModalOpen}
        onClose={() => {
          setIsAskModalOpen(false);
          setTargetedExpertForAsk(undefined);
        }}
        onSubmitQuestion={handleAddQuestion}
        targetedExpertName={targetedExpertForAsk}
      />

      <ExpertApplicationModal
        isOpen={isApplicationModalOpen}
        onClose={() => setIsApplicationModalOpen(false)}
      />

      <PublishArticleModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
      />
    </div>
  );
}
