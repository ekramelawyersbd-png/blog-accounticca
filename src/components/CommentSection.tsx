import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeToArticleComments, 
  postProfessionalComment, 
  toggleEndorsement,
  deleteProfessionalComment,
  CommentItem, 
  CommentType,
  ProfessionalRole,
  PROFESSIONAL_ROLES, 
  DISCUSSION_TOPIC_TAGS 
} from '../services/commentService';
import { 
  MessageSquare, 
  ThumbsUp, 
  LogIn, 
  Send, 
  Loader2, 
  User as UserIcon, 
  HelpCircle, 
  Lightbulb, 
  CheckCircle2, 
  Scale, 
  Calculator, 
  Briefcase, 
  Award, 
  CornerDownRight, 
  Sparkles, 
  Filter, 
  Clock, 
  Share2, 
  Trash2, 
  FileText, 
  RefreshCw,
  Search,
  Check,
  ShieldCheck,
  ChevronDown,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

interface CommentSectionProps {
  articleId: string;
  articleTitle?: string;
  articleCategory?: string;
}

export function CommentSection({ 
  articleId, 
  articleTitle, 
  articleCategory 
}: CommentSectionProps) {
  const { user, signInWithGoogle } = useAuth();
  
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [commentType, setCommentType] = useState<CommentType>('insight');
  const [selectedTopic, setSelectedTopic] = useState<string>(() => {
    if (articleCategory && articleCategory.toLowerCase().includes('vat')) {
      return 'VAT & SD Compliance';
    }
    if (articleCategory && (articleCategory.toLowerCase().includes('company') || articleCategory.toLowerCase().includes('rjsc'))) {
      return 'Corporate Law & RJSC';
    }
    if (articleCategory && articleCategory.toLowerCase().includes('withholding')) {
      return 'Withholding Tax (TDS)';
    }
    return 'Tax Assessment & ITA 2023';
  });
  const [statutoryRef, setStatutoryRef] = useState('');
  const [commentText, setCommentText] = useState('');
  const [authorRole, setAuthorRole] = useState<ProfessionalRole>('chartered_accountant');
  const [organization, setOrganization] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [isGuestMode, setIsGuestMode] = useState(false);

  // Reply State
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Filtering & Sorting State
  const [typeFilter, setTypeFilter] = useState<'all' | 'insight' | 'question'>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'helpful'>('recent');
  const [searchQuery, setSearchQuery] = useState('');

  // Endorsements tracked locally per session
  const [votedCommentIds, setVotedCommentIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(`accounticca_voted_${articleId}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // 1. Subscribe to Firestore comments with fallback
  useEffect(() => {
    if (!articleId) return;

    setLoading(true);
    const unsubscribe = subscribeToArticleComments(
      articleId,
      (updatedComments) => {
        setComments(updatedComments);
        setLoading(false);
        setIsRefreshing(false);
      },
      (error) => {
        console.warn('Comment subscription error:', error);
        setLoading(false);
        setIsRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, [articleId]);

  // Handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Helper to get role details
  const getRoleInfo = (roleKey: ProfessionalRole) => {
    return PROFESSIONAL_ROLES.find(r => r.value === roleKey) || PROFESSIONAL_ROLES[0];
  };

  // 2. Submit new top-level comment (Insight or Question)
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!commentText.trim()) return;

    const authorDisplayName = user?.displayName || guestName.trim();
    if (!user && !authorDisplayName) {
      setErrorMessage('Please enter your Name / Title (e.g. Adv. Kamal or Farhad, FCA) or sign in with Google to post.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedRoleInfo = getRoleInfo(authorRole);
      const email = user?.email || (guestEmail.trim() ? guestEmail.trim() : undefined);

      await postProfessionalComment({
        articleId,
        userId: user?.uid,
        authorName: authorDisplayName,
        authorEmail: email,
        role: authorRole,
        roleLabel: selectedRoleInfo.label,
        organization: organization.trim() || undefined,
        statutoryRef: statutoryRef.trim() || undefined,
        topicTag: selectedTopic,
        commentType,
        avatar: user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authorDisplayName)}`,
        text: commentText.trim(),
        parentId: null
      });

      setCommentText('');
      setStatutoryRef('');
      setErrorMessage('');
      setSubmitSuccessMsg(
        commentType === 'question' 
          ? 'Your legal & tax question has been posted to our professional community!'
          : 'Your technical insight has been published successfully!'
      );
      setTimeout(() => setSubmitSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Failed to post comment:', err);
      setErrorMessage('Unable to post discussion at this moment. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Submit Reply / Answer
  const handleReplySubmit = async (parentId: string) => {
    if (!replyText.trim()) return;
    setErrorMessage('');

    const authorDisplayName = user?.displayName || guestName.trim() || 'Practitioner';
    setReplySubmitting(true);
    try {
      const selectedRoleInfo = getRoleInfo(authorRole);
      const parentComment = comments.find(c => c.id === parentId);
      const isAnsweringQuestion = parentComment?.commentType === 'question';

      await postProfessionalComment({
        articleId,
        userId: user?.uid,
        authorName: authorDisplayName,
        authorEmail: user?.email || undefined,
        role: authorRole,
        roleLabel: selectedRoleInfo.label,
        organization: organization.trim() || undefined,
        statutoryRef: statutoryRef.trim() || undefined,
        topicTag: parentComment?.topicTag || selectedTopic,
        commentType: isAnsweringQuestion ? 'insight' : 'insight',
        avatar: user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authorDisplayName)}`,
        text: replyText.trim(),
        parentId: parentId
      });

      setReplyText('');
      setReplyingToId(null);
    } catch (err) {
      console.error('Failed to submit reply:', err);
      setErrorMessage('Unable to submit reply. Please try again.');
    } finally {
      setReplySubmitting(false);
    }
  };

  // 4. Handle Endorse / Helpful
  const handleToggleEndorse = async (commentId: string) => {
    const hasVoted = votedCommentIds.has(commentId);
    const nextSet = new Set(votedCommentIds);
    if (hasVoted) {
      nextSet.delete(commentId);
    } else {
      nextSet.add(commentId);
    }
    setVotedCommentIds(nextSet);

    try {
      localStorage.setItem(`accounticca_voted_${articleId}`, JSON.stringify(Array.from(nextSet)));
      await toggleEndorsement(articleId, commentId, hasVoted);
    } catch (err) {
      console.error('Error toggling endorsement:', err);
    }
  };

  // 5. Handle Delete
  const handleDelete = async (commentId: string) => {
    try {
      await deleteProfessionalComment(articleId, commentId);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Failed to delete comment:', err);
      setErrorMessage('Failed to delete comment. Please try again.');
    }
  };

  // 6. Share / Copy Comment Link
  const handleShareComment = (commentId: string) => {
    const url = `${window.location.origin}${window.location.pathname}#comment-${commentId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedId(commentId);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // Separate top-level comments and replies
  const { topLevelComments, repliesMap, countInsights, countQuestions } = useMemo(() => {
    const topLevel: CommentItem[] = [];
    const replies: Record<string, CommentItem[]> = {};
    let insights = 0;
    let questions = 0;

    comments.forEach(c => {
      if (c.commentType === 'question') {
        questions++;
      } else {
        insights++;
      }

      if (c.parentId) {
        if (!replies[c.parentId]) {
          replies[c.parentId] = [];
        }
        replies[c.parentId].push(c);
      } else {
        topLevel.push(c);
      }
    });

    // Sort replies chronologically
    Object.keys(replies).forEach(pId => {
      replies[pId].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    return {
      topLevelComments: topLevel,
      repliesMap: replies,
      countInsights: insights,
      countQuestions: questions
    };
  }, [comments]);

  // Filter and sort top-level comments
  const filteredComments = useMemo(() => {
    return topLevelComments.filter(item => {
      // Type filter
      if (typeFilter !== 'all' && (item.commentType || 'insight') !== typeFilter) {
        return false;
      }
      // Topic filter
      if (topicFilter !== 'all' && item.topicTag !== topicFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesAuthor = item.authorName.toLowerCase().includes(q);
        const matchesText = item.text.toLowerCase().includes(q);
        const matchesStatutory = item.statutoryRef?.toLowerCase().includes(q);
        const matchesTopic = item.topicTag?.toLowerCase().includes(q);
        if (!matchesAuthor && !matchesText && !matchesStatutory && !matchesTopic) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'helpful') {
        return b.helpfulCount - a.helpfulCount;
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [topLevelComments, typeFilter, topicFilter, sortBy, searchQuery]);

  return (
    <section 
      id="professional-comments-section" 
      aria-label="Professional Comments and Legal Peer Discussion"
      className="mt-16 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-sm scroll-mt-28"
    >
      {/* Header & Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-center justify-center text-emerald-700 shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Professional Discussions & Inquiries
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {comments.length}
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-1">
                Peer exchange for lawyers, tax accountants, and corporate practitioners in Bangladesh.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh comments"
            title="Refresh discussions from cloud"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* Statutory Guidance Note */}
      <div className="my-6 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-600 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <span className="font-bold text-slate-800">Peer Exchange Forum:</span> Share interpretations of the Income Tax Act 2023, VAT & SD Act 2012, RJSC corporate regulations, and High Court Division case law. Discussions reflect professional viewpoints and do not constitute formal attorney-client or audit counsel.
        </p>
      </div>

      {/* Success Notification */}
      {submitSuccessMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{submitSuccessMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center justify-between gap-2.5 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-100 hover:bg-rose-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Discussion Starters for Accountants & Tax Experts */}
      <div className="mb-8 p-4 sm:p-5 bg-gradient-to-r from-emerald-50/80 via-slate-50 to-teal-50/60 border border-emerald-200/90 rounded-2xl">
        <div className="flex items-center gap-2 mb-2.5">
          <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
            Discussion Starters &bull; Tap to Populate Topic
          </h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            {
              label: '💼 Section 272 Compounding Penalties',
              topic: 'Tax Assessment & ITA 2023',
              type: 'insight' as const,
              text: 'Regarding Section 272 ITA 2023: Before the Taxes Appellate Tribunal, establishing lack of willful concealment and proving bona fide timing difference in accounts is essential to challenge arbitrary penalty orders.'
            },
            {
              label: '📊 Mushak 9.1 VAT Reconciliation',
              topic: 'VAT & SD Compliance',
              type: 'insight' as const,
              text: 'Reconciling monthly Mushak 9.1 returns with audited financial statements: Ensure debit notes, credit notes, and bank realization certificates (PRC) are cross-referenced to withstand commissionerate audit.'
            },
            {
              label: '❓ Query: Cross-Border Cloud & SaaS TDS',
              topic: 'Withholding Tax (TDS)',
              type: 'question' as const,
              text: 'What is the applicable withholding tax (TDS) and VAT rate when remitting payments for overseas SaaS/cloud subscriptions without a local PE in Bangladesh? Does the AD bank issue Form 16C automatically?'
            },
            {
              label: '⚖️ RJSC Annual Filing & Form XII',
              topic: 'Corporate Law & RJSC',
              type: 'insight' as const,
              text: 'For private and public limited companies: Timely filing of Form XII, Schedule X, and audited accounts with RJSC within 30 days of the AGM prevents costly registrar condonation petitions before the High Court.'
            }
          ].map((starter, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSelectedTopic(starter.topic);
                setCommentType(starter.type);
                if (!commentText.trim()) {
                  setCommentText(starter.text);
                }
              }}
              className="text-xs font-medium px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 text-slate-800 hover:text-emerald-800 hover:bg-emerald-50 transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              {starter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Composer Section */}
      <div className="mb-12 bg-slate-50/70 border border-slate-200 rounded-2xl p-5 sm:p-7">
        
        {/* Toggle between Insight and Question */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="inline-flex p-1 bg-slate-200/80 rounded-xl">
            <button
              type="button"
              onClick={() => setCommentType('insight')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                commentType === 'insight'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Share Insight / Analysis</span>
            </button>
            <button
              type="button"
              onClick={() => setCommentType('question')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                commentType === 'question'
                  ? 'bg-white text-indigo-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
              <span>Ask Tax / Legal Question</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {commentType === 'insight' 
                ? 'Contribute practical audit or litigation experience'
                : 'Get peer feedback from accredited practitioners'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmitComment} className="space-y-4">
          
          {/* Topic Selector & Statutory Reference Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Specific Legal / Tax Topic
              </label>
              <div className="relative">
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none cursor-pointer pr-9"
                >
                  {DISCUSSION_TOPIC_TAGS.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Statutory / Legal Citation <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                inputMode="text"
                value={statutoryRef}
                onChange={(e) => setStatutoryRef(e.target.value)}
                placeholder="e.g. Section 272 ITA 2023 or Mushak 9.1"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Practitioner Role and Chamber */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Professional Designation
              </label>
              <div className="relative">
                <select
                  value={authorRole}
                  onChange={(e) => setAuthorRole(e.target.value as ProfessionalRole)}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none cursor-pointer pr-9"
                >
                  {PROFESSIONAL_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Firm / Chamber / Company <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                inputMode="text"
                autoComplete="organization"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. Supreme Court Bar, Farhad & Co."
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* User Sign-In or Practitioner Identity Fields */}
          {!user ? (
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Contributor Credentials</h5>
                    <p className="text-[11px] text-slate-500">Enter your name and designation, or sign in with Google for auto-verification</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={signInWithGoogle}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
                >
                  <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sign In with Google</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Name &amp; Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="text"
                    autoComplete="name"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Farhad Hossain, FCA or Adv. Kamal"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address <span className="text-slate-400 font-normal">(Private notification)</span>
                  </label>
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="partner@auditfirm.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs">
              <div className="flex items-center gap-3">
                <img 
                  src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName || 'User')}`} 
                  alt={user.displayName || 'User'} 
                  className="w-8 h-8 rounded-full border border-emerald-300 object-cover" 
                />
                <div>
                  <p className="font-bold text-slate-900">{user.displayName}</p>
                  <p className="text-[11px] text-emerald-800 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Professional Account ({user.email})</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Textarea */}
          <div className="relative">
            <textarea
              required
              rows={4}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={
                commentType === 'insight'
                  ? 'Detail your statutory analysis, audit consideration, or case law precedent related to this topic...'
                  : 'State your tax or legal query clearly (e.g., What is the applicable withholding rate on foreign SaaS under Section 119?)...'
              }
              className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-y leading-relaxed"
            />
          </div>

          {/* Submit Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">Recommended Topics:</span>
              <button 
                type="button" 
                onClick={() => setSelectedTopic('Tax Assessment & ITA 2023')} 
                className="hover:text-emerald-700 cursor-pointer underline"
              >
                ITA 2023
              </button>
              <span>•</span>
              <button 
                type="button" 
                onClick={() => setSelectedTopic('Withholding Tax (TDS)')} 
                className="hover:text-emerald-700 cursor-pointer underline"
              >
                TDS & SROs
              </button>
              <span>•</span>
              <button 
                type="button" 
                onClick={() => setSelectedTopic('VAT & SD Compliance')} 
                className="hover:text-emerald-700 cursor-pointer underline"
              >
                Mushak 9.1
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !commentText.trim()}
              className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                commentType === 'insight'
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : 'bg-indigo-700 hover:bg-indigo-800'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <span>
                    {commentType === 'insight' ? 'Post Professional Insight' : 'Submit Legal Question'}
                  </span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Filter and Sorting Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100">
        
        {/* Type Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Discussions ({topLevelComments.length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('insight')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              typeFilter === 'insight'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <Lightbulb className="w-3 h-3" />
            <span>Insights ({countInsights})</span>
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('question')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              typeFilter === 'question'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
            }`}
          >
            <HelpCircle className="w-3 h-3" />
            <span>Questions ({countQuestions})</span>
          </button>
        </div>

        {/* Search and Topic Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              inputMode="search"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search comments..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="relative">
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 pr-7 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">All Topics</option>
              {DISCUSSION_TOPIC_TAGS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'helpful')}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 pr-7 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="recent">Most Recent</option>
              <option value="helpful">Most Endorsed</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

      </div>

      {/* Comment List */}
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4 py-4" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <div className="space-y-1.5">
                    <div className="w-36 h-4 bg-slate-200 rounded" />
                    <div className="w-24 h-3 bg-slate-200/60 rounded" />
                  </div>
                </div>
                <div className="w-3/4 h-3 bg-slate-200 rounded" />
                <div className="w-full h-12 bg-slate-200/60 rounded" />
              </div>
            ))}
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <h4 className="font-bold text-slate-800 text-base">No discussions match your filter</h4>
            <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
              Be the first to share an expert insight or post a legal inquiry on this tax topic.
            </p>
            <button
              type="button"
              onClick={() => {
                setTypeFilter('all');
                setTopicFilter('all');
                setSearchQuery('');
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50 transition-colors shadow-2xs cursor-pointer"
            >
              <span>Reset Filters</span>
            </button>
          </div>
        ) : (
          filteredComments.map((comment) => {
            const replies = repliesMap[comment.id] || [];
            const isVoted = votedCommentIds.has(comment.id);
            const isAuthor = user?.uid && comment.userId === user.uid;
            const roleInfo = getRoleInfo(comment.role);
            const isQuestion = comment.commentType === 'question';

            return (
              <article
                key={comment.id}
                id={`comment-${comment.id}`}
                className="group bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-shadow"
              >
                {/* Header: Author details & Badges */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3.5">
                    <img
                      src={comment.avatar}
                      alt={comment.authorName}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-slate-200 object-cover shrink-0 mt-0.5"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                          {comment.authorName}
                        </h4>
                        {comment.isVerifiedProfessional && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Verified Practitioner</span>
                          </span>
                        )}
                      </div>

                      {/* Role & Chamber */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                        <span className={`font-semibold ${roleInfo.badgeColor}`}>
                          {comment.roleLabel || roleInfo.label}
                        </span>
                        {comment.organization && (
                          <>
                            <span>•</span>
                            <span className="text-slate-600">{comment.organization}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="text-slate-400">
                          {format(new Date(comment.date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Comment Type Pill (Insight vs Question) */}
                  <div className="shrink-0">
                    {isQuestion ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Question</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                        <span>Insight</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Topic and Statutory Ref Tags */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {comment.topicTag && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/70">
                      <span>{comment.topicTag}</span>
                    </span>
                  )}
                  {comment.statutoryRef && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium bg-amber-50 text-amber-900 border border-amber-200/80">
                      <FileText className="w-3 h-3 text-amber-700" />
                      <span>{comment.statutoryRef}</span>
                    </span>
                  )}
                </div>

                {/* Body Text */}
                <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap pl-0.5">
                  {comment.text}
                </div>

                {/* Actions: Endorse, Reply, Share, Delete */}
                <div className="flex items-center justify-between gap-4 mt-5 pt-4 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleEndorse(comment.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                        isVoted
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border-slate-200'
                      }`}
                      title={isVoted ? "Endorsement recorded" : "Endorse this professional commentary"}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${isVoted ? 'fill-current' : ''}`} />
                      <span>{comment.helpfulCount || 0}</span>
                      <span className="hidden sm:inline font-normal">
                        {isVoted ? 'Endorsed' : 'Endorse'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold transition-colors cursor-pointer"
                    >
                      <CornerDownRight className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isQuestion ? 'Answer Query' : 'Reply'}</span>
                      {replies.length > 0 && (
                        <span className="ml-1 text-[11px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
                          {replies.length}
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleShareComment(comment.id)}
                      title="Copy link to this discussion"
                      className="inline-flex items-center gap-1 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {copiedId === comment.id ? (
                        <span className="text-[11px] font-bold text-emerald-600">Copied!</span>
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isAuthor && (
                      confirmDeleteId === comment.id ? (
                        <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-lg p-1 text-xs">
                          <span className="text-rose-700 text-[11px] font-bold px-1">Delete?</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(comment.id)}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(comment.id)}
                          title="Delete your comment"
                          className="inline-flex items-center p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Inline Reply Composer */}
                {replyingToId === comment.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/80 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2 text-xs font-semibold text-slate-600">
                      <span>Replying to {comment.authorName}</span>
                      <button
                        type="button"
                        onClick={() => setReplyingToId(null)}
                        className="text-slate-400 hover:text-slate-700 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={
                        isQuestion
                          ? 'Provide statutory reasoning or procedural advice to address this question...'
                          : 'Add your perspective or clarification to this insight...'
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none resize-none leading-relaxed mb-3"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={replySubmitting || !replyText.trim()}
                        onClick={() => handleReplySubmit(comment.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {replySubmitting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <span>{isQuestion ? 'Post Answer' : 'Submit Reply'}</span>
                            <Send className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Nested Replies */}
                {replies.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-100 space-y-3.5 pl-4 sm:pl-6 border-l-2 border-slate-200/80 ml-2">
                    {replies.map((reply) => {
                      const isReplyVoted = votedCommentIds.has(reply.id);
                      const isReplyAuthor = user?.uid && reply.userId === user.uid;
                      const replyRoleInfo = getRoleInfo(reply.role);

                      return (
                        <div 
                          key={reply.id} 
                          id={`comment-${reply.id}`}
                          className="bg-slate-50/90 rounded-xl p-4 border border-slate-200/80"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={reply.avatar}
                                alt={reply.authorName}
                                className="w-7 h-7 rounded-full border border-slate-200 object-cover shrink-0"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="font-bold text-slate-900 text-xs">
                                    {reply.authorName}
                                  </h5>
                                  <span className={`text-[10px] font-semibold ${replyRoleInfo.badgeColor}`}>
                                    {reply.roleLabel || replyRoleInfo.label}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  {format(new Date(reply.date), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>

                            {isQuestion && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Answer
                              </span>
                            )}
                          </div>

                          <p className="text-slate-800 text-xs leading-relaxed whitespace-pre-wrap">
                            {reply.text}
                          </p>

                          <div className="flex items-center justify-between gap-3 mt-3 pt-2 border-t border-slate-200/60 text-[11px]">
                            <button
                              type="button"
                              onClick={() => handleToggleEndorse(reply.id)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                                isReplyVoted
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-white text-slate-600 hover:text-emerald-700 border-slate-200'
                              }`}
                            >
                              <ThumbsUp className={`w-3 h-3 ${isReplyVoted ? 'fill-current' : ''}`} />
                              <span>{reply.helpfulCount || 0}</span>
                            </button>

                            {isReplyAuthor && (
                              <button
                                type="button"
                                onClick={() => handleDelete(reply.id)}
                                className="text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Delete your reply"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </article>
            );
          })
        )}
      </div>

    </section>
  );
}
