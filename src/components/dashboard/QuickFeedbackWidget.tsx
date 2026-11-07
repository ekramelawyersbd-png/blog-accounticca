import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquarePlus, 
  Star, 
  ThumbsUp, 
  Send, 
  Wrench, 
  FileText, 
  CheckCircle2, 
  Filter, 
  Sparkles, 
  TrendingUp, 
  BarChart3, 
  Trash2, 
  Edit3, 
  Check, 
  Search, 
  Info, 
  HelpCircle, 
  Award,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Share2
} from 'lucide-react';
import { mockArticles } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';

export interface FeedbackRecord {
  id: string;
  itemType: 'tool' | 'article';
  targetId: string;
  targetName: string;
  targetCategory?: string;
  rating: number;
  accuracyRating?: number;
  clarityRating?: number;
  selectedTags: string[];
  comment: string;
  createdAt: string;
  userEmail?: string;
  userName?: string;
  isAnonymous?: boolean;
  status: 'submitted' | 'reviewed' | 'addressed';
  helpfulCount: number;
}

const FEATURED_TOOLS = [
  { id: 'tool-rjsc-fee', name: 'RJSC Fee Calculator & Stamp Duty Estimator', category: 'Corporate Law' },
  { id: 'tool-capital-gains', name: 'Capital Gains Tax Calculator 2026', category: 'Income Tax' },
  { id: 'tool-corporate-tax', name: 'Corporate Tax Rate & Surcharge Matrix', category: 'Corporate Tax' },
  { id: 'tool-wealth-surcharge', name: 'Wealth Surcharge Calculator', category: 'Income Tax' },
  { id: 'tool-investment-rebate', name: 'Investment Rebate Tax Calculator', category: 'Income Tax' },
  { id: 'tool-agricultural-tax', name: 'Agricultural Income Tax Calculator', category: 'Income Tax' },
  { id: 'tool-minimum-turnover', name: 'Minimum Turnover Tax Calculator', category: 'Taxation' },
  { id: 'tool-dvc-verify', name: 'DVC Verification & Audit Tracking', category: 'Audit & Compliance' },
  { id: 'tool-post-reg-checklist', name: 'Post-Registration Compliance Checklist', category: 'Corporate Law' },
  { id: 'tool-early-filing', name: 'Early Tax Filing Incentive Estimator', category: 'Income Tax' },
  { id: 'tool-rjsc-functions', name: 'RJSC Functions & Regulatory Explorer', category: 'Corporate Law' }
];

const QUICK_TAGS_POSITIVE = [
  'Accurate Math',
  'Saved Time',
  'Easy UI',
  'Clear Explanations',
  'Helpful Citations',
  'Up-to-Date Rules',
  'Great Practical Example'
];

const QUICK_TAGS_IMPROVEMENT = [
  'Needs More Examples',
  'Confusing Terminology',
  'Missing Latest Circular',
  'Discrepancy in Result',
  'Mobile Layout Issue',
  'Add Export Option'
];

const INITIAL_MOCK_FEEDBACK: FeedbackRecord[] = [
  {
    id: 'fb-101',
    itemType: 'tool',
    targetId: 'tool-rjsc-fee',
    targetName: 'RJSC Fee Calculator & Stamp Duty Estimator',
    targetCategory: 'Corporate Law',
    rating: 5,
    accuracyRating: 5,
    clarityRating: 5,
    selectedTags: ['Accurate Math', 'Saved Time', 'Easy UI'],
    comment: 'Estimated authorized capital breakdown for BDT 1 Crore company accurately matched official RJSC treasury chalan!',
    createdAt: '2026-10-17T14:30:00Z',
    userName: 'Advocate Rafiqul Islam',
    userEmail: 'rafiqul@lawchambers.bd',
    isAnonymous: false,
    status: 'reviewed',
    helpfulCount: 14
  },
  {
    id: 'fb-102',
    itemType: 'article',
    targetId: mockArticles[0]?.id || 'art-1',
    targetName: mockArticles[0]?.title || 'Finance Act 2026: Key Changes in Individual Income Tax Slabs',
    targetCategory: 'Income Tax',
    rating: 5,
    accuracyRating: 5,
    clarityRating: 4,
    selectedTags: ['Clear Explanations', 'Helpful Citations'],
    comment: 'Super helpful summary of Section 265 Income Tax Act 2023 provisions. Made client presentation very straightforward.',
    createdAt: '2026-10-16T09:15:00Z',
    userName: 'Nusrat Jahan, ACA',
    userEmail: 'nusrat.ca@auditfirm.com',
    isAnonymous: false,
    status: 'reviewed',
    helpfulCount: 9
  },
  {
    id: 'fb-103',
    itemType: 'tool',
    targetId: 'tool-capital-gains',
    targetName: 'Capital Gains Tax Calculator 2026',
    targetCategory: 'Income Tax',
    rating: 4,
    accuracyRating: 5,
    clarityRating: 4,
    selectedTags: ['Accurate Math', 'Needs More Examples'],
    comment: 'Calculations are spot-on for land transfer CGT. Would love to see a side-by-side comparison for share transfer gains.',
    createdAt: '2026-10-15T11:45:00Z',
    userName: 'Tanvir Hossain',
    userEmail: 'tanvir@techcorp.bd',
    isAnonymous: false,
    status: 'submitted',
    helpfulCount: 6
  }
];

const STORAGE_KEY = 'elawyers_quick_feedback_records';

export const QuickFeedbackWidget: React.FC = () => {
  const { user } = useAuth();
  const [feedbackRecords, setFeedbackRecords] = useState<FeedbackRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse feedback records', e);
    }
    return INITIAL_MOCK_FEEDBACK;
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(feedbackRecords));
    } catch (e) {
      console.error('Failed to save feedback records', e);
    }
  }, [feedbackRecords]);

  // Form State
  const [itemType, setItemType] = useState<'tool' | 'article'>('tool');
  const [selectedTargetId, setSelectedTargetId] = useState<string>(FEATURED_TOOLS[0].id);
  const [customSearchQuery, setCustomSearchQuery] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [accuracyRating, setAccuracyRating] = useState<number>(5);
  const [clarityRating, setClarityRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Accurate Math', 'Easy UI']);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedToast, setSubmittedToast] = useState(false);

  // Filter & History View State
  const [historyTabFilter, setHistoryTabFilter] = useState<'all' | 'tool' | 'article' | 'mine'>('all');
  const [historySearch, setHistorySearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isExpandedForm, setIsExpandedForm] = useState(true);

  // Sync available targets
  const articleOptions = useMemo(() => {
    return mockArticles.map(art => ({
      id: art.id,
      name: art.title,
      category: art.category
    }));
  }, []);

  const availableTargets = useMemo(() => {
    if (itemType === 'tool') return FEATURED_TOOLS;
    return articleOptions;
  }, [itemType, articleOptions]);

  // Set default selected target when itemType switches
  useEffect(() => {
    if (itemType === 'tool') {
      setSelectedTargetId(FEATURED_TOOLS[0].id);
    } else if (articleOptions.length > 0) {
      setSelectedTargetId(articleOptions[0].id);
    }
  }, [itemType, articleOptions]);

  // Current target object
  const currentTargetObj = useMemo(() => {
    return availableTargets.find(t => t.id === selectedTargetId) || availableTargets[0];
  }, [availableTargets, selectedTargetId]);

  // Toggle tag selection
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Submit Handler
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTargetObj) return;

    setIsSubmitting(true);

    setTimeout(() => {
      if (editingId) {
        // Edit existing record
        setFeedbackRecords(prev => prev.map(rec => {
          if (rec.id === editingId) {
            return {
              ...rec,
              itemType,
              targetId: currentTargetObj.id,
              targetName: currentTargetObj.name,
              targetCategory: currentTargetObj.category,
              rating,
              accuracyRating,
              clarityRating,
              selectedTags,
              comment,
              isAnonymous,
              createdAt: new Date().toISOString()
            };
          }
          return rec;
        }));
        setEditingId(null);
      } else {
        // Create new record
        const newRecord: FeedbackRecord = {
          id: `fb-${Date.now()}`,
          itemType,
          targetId: currentTargetObj.id,
          targetName: currentTargetObj.name,
          targetCategory: currentTargetObj.category,
          rating,
          accuracyRating,
          clarityRating,
          selectedTags,
          comment: comment.trim() || 'No detailed written comments provided.',
          createdAt: new Date().toISOString(),
          userName: isAnonymous ? 'Anonymous Member' : (user?.displayName || user?.email?.split('@')[0] || 'Registered User'),
          userEmail: isAnonymous ? undefined : user?.email,
          isAnonymous,
          status: 'submitted',
          helpfulCount: 0
        };

        setFeedbackRecords(prev => [newRecord, ...prev]);
      }

      setIsSubmitting(false);
      setComment('');
      setSubmittedToast(true);
      setTimeout(() => setSubmittedToast(false), 4000);
    }, 400);
  };

  // Start edit
  const handleStartEdit = (record: FeedbackRecord) => {
    setEditingId(record.id);
    setItemType(record.itemType);
    setSelectedTargetId(record.targetId);
    setRating(record.rating);
    setAccuracyRating(record.accuracyRating || 5);
    setClarityRating(record.clarityRating || 5);
    setSelectedTags(record.selectedTags || []);
    setComment(record.comment === 'No detailed written comments provided.' ? '' : record.comment);
    setIsAnonymous(!!record.isAnonymous);
    setIsExpandedForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setComment('');
  };

  // Delete record
  const handleDeleteRecord = (id: string) => {
    if (window.confirm('Are you sure you want to delete this feedback entry?')) {
      setFeedbackRecords(prev => prev.filter(r => r.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  // Upvote helpful feedback
  const handleHelpfulUpvote = (id: string) => {
    setFeedbackRecords(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, helpfulCount: r.helpfulCount + 1 };
      }
      return r;
    }));
  };

  // Summary Analytics
  const stats = useMemo(() => {
    const total = feedbackRecords.length;
    if (total === 0) return { avgRating: 0, totalToolFb: 0, totalArticleFb: 0, topRatedName: 'N/A' };

    const sumRating = feedbackRecords.reduce((acc, r) => acc + r.rating, 0);
    const avgRating = (sumRating / total).toFixed(1);

    const toolFb = feedbackRecords.filter(r => r.itemType === 'tool').length;
    const articleFb = feedbackRecords.filter(r => r.itemType === 'article').length;

    // Highest rated item
    const ratingsMap: Record<string, { sum: number; count: number; name: string }> = {};
    feedbackRecords.forEach(r => {
      if (!ratingsMap[r.targetName]) {
        ratingsMap[r.targetName] = { sum: 0, count: 0, name: r.targetName };
      }
      ratingsMap[r.targetName].sum += r.rating;
      ratingsMap[r.targetName].count += 1;
    });

    let topName = 'RJSC Fee Calculator';
    let topScore = 0;
    Object.values(ratingsMap).forEach(item => {
      const avg = item.sum / item.count;
      if (avg > topScore) {
        topScore = avg;
        topName = item.name;
      }
    });

    return {
      total,
      avgRating,
      totalToolFb: toolFb,
      totalArticleFb: articleFb,
      topRatedName: topName
    };
  }, [feedbackRecords]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    return feedbackRecords.filter(rec => {
      const matchesType = historyTabFilter === 'all' 
        ? true 
        : historyTabFilter === 'mine' 
          ? (user?.email && rec.userEmail === user.email) || (!rec.isAnonymous && rec.userName === (user?.displayName || user?.email?.split('@')[0]))
          : rec.itemType === historyTabFilter;

      const q = historySearch.trim().toLowerCase();
      const matchesSearch = !q || 
        rec.targetName.toLowerCase().includes(q) ||
        rec.comment.toLowerCase().includes(q) ||
        (rec.userName && rec.userName.toLowerCase().includes(q)) ||
        rec.selectedTags.some(t => t.toLowerCase().includes(q));

      return matchesType && matchesSearch;
    });
  }, [feedbackRecords, historyTabFilter, historySearch, user]);

  return (
    <div id="quick-feedback-widget-section" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold shrink-0 shadow-xs">
              <MessageSquarePlus className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>Quick Feedback & Content Rating</span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Live Survey
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Rate your experience with our legal tax calculators, RJSC tools, and compliance articles to help us improve future features.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Analytics Summary Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Avg Satisfaction</p>
              <p className="font-extrabold text-slate-900">{stats.avgRating} / 5.0</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Reviews</p>
              <p className="font-extrabold text-slate-900">{stats.total} Submitted</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Toast */}
      {submittedToast && (
        <div className="bg-emerald-900 text-white p-4 rounded-2xl flex items-center justify-between gap-3 shadow-md animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-sm">Thank you for your feedback!</p>
              <p className="text-xs text-emerald-200">
                Your rating and suggestions have been securely stored. Our legal tech engineering team reviews user ratings to continuously refine calculation accuracy and article depth.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setSubmittedToast(false)} 
            className="text-emerald-300 hover:text-white text-xs font-bold px-2 py-1 bg-emerald-800 rounded-lg"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{editingId ? 'Edit Your Submitted Feedback' : 'Rate a Specific Tool or Article'}</span>
          </h3>

          <button
            type="button"
            onClick={() => setIsExpandedForm(!isExpandedForm)}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
          >
            <span>{isExpandedForm ? 'Minimize Form' : 'Expand Form'}</span>
            {isExpandedForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isExpandedForm && (
          <form onSubmit={handleSubmitFeedback} className="space-y-6">
            {/* Step 1: Select Type & Target */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Type Switcher */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-white border border-slate-200 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setItemType('tool')}
                    className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                      itemType === 'tool'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Legal Tool</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setItemType('article')}
                    className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                      itemType === 'article'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Article Guide</span>
                  </button>
                </div>
              </div>

              {/* Target Dropdown */}
              <div className="md:col-span-8 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Specific {itemType === 'tool' ? 'Calculator or Tool' : 'Compliance Article'}
                </label>
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
                >
                  {availableTargets.map(target => (
                    <option key={target.id} value={target.id}>
                      {target.name} ({target.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 2: Star Rating & Multi-criteria */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Overall Satisfaction Rating *
                  </label>
                  <p className="text-[11px] text-slate-500">How satisfied were you with this {itemType}?</p>
                </div>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          star <= (hoverRating || rating)
                            ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                            : 'text-slate-200 fill-slate-100'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 font-extrabold text-sm text-slate-800 min-w-[70px]">
                    {rating === 5 ? '⭐️⭐️⭐️⭐️⭐️ Excellent' : rating === 4 ? '⭐️⭐️⭐️⭐️ Very Good' : rating === 3 ? '⭐️⭐️⭐️ Average' : rating === 2 ? '⭐️⭐️ Needs Work' : '⭐️ Poor'}
                  </span>
                </div>
              </div>

              {/* Sub Ratings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                <div className="space-y-1">
                  <span className="font-bold text-slate-700">Calculation & Rule Accuracy:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={accuracyRating}
                      onChange={(e) => setAccuracyRating(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <span className="font-extrabold text-slate-800 w-8">{accuracyRating}/5</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-slate-700">Clarity & Ease of Understanding:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={clarityRating}
                      onChange={(e) => setClarityRating(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <span className="font-extrabold text-slate-800 w-8">{clarityRating}/5</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Quick Feedback Tags / Chips */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Quick Feedback Tags (Select all that apply)
              </label>

              <div className="flex flex-wrap gap-2">
                {QUICK_TAGS_POSITIVE.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ThumbsUp className="w-3 h-3 text-slate-400" />}
                      <span>{tag}</span>
                    </button>
                  );
                })}

                {QUICK_TAGS_IMPROVEMENT.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:text-amber-800'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5 text-amber-600" /> : <Info className="w-3 h-3 text-slate-400" />}
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Text Comments */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-700 uppercase tracking-wider">
                  Detailed Suggestions / Feedback Notes
                </label>
                <span className="text-slate-400 text-[11px]">{comment.length} / 500 chars</span>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="Share specific statutory rules, missing features, or suggestions to help us refine future calculators and legal content..."
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs resize-none"
              />
            </div>

            {/* Step 5: Options & Submit Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>Submit as Anonymous Feedback (hide name/email)</span>
              </label>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{editingId ? 'Update Feedback' : 'Submit Quick Feedback'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Community & Personal Feedback History */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-base">
              Submitted Feedback & Reviews Log ({filteredHistory.length})
            </h3>
          </div>

          {/* Filter Tabs & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search reviews..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44"
              />
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              <button
                onClick={() => setHistoryTabFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  historyTabFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setHistoryTabFilter('tool')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  historyTabFilter === 'tool' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Tools
              </button>
              <button
                onClick={() => setHistoryTabFilter('article')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  historyTabFilter === 'article' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Articles
              </button>
              <button
                onClick={() => setHistoryTabFilter('mine')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  historyTabFilter === 'mine' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Mine
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Cards List */}
        {filteredHistory.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <Info className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-600">No feedback entries found matching criteria</p>
            <p className="text-[11px] text-slate-400">Be the first to submit a review for our legal tools!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHistory.map((rec) => {
              const isOwner = user?.email && rec.userEmail === user.email;

              return (
                <div 
                  key={rec.id} 
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {/* Top Row: Target & Rating */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md mb-1 ${
                          rec.itemType === 'tool' 
                            ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        }`}>
                          {rec.itemType === 'tool' ? <Wrench className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                          <span>{rec.itemType} • {rec.targetCategory || 'General'}</span>
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1" title={rec.targetName}>
                          {rec.targetName}
                        </h4>
                      </div>

                      <div className="flex items-center gap-0.5 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg shrink-0">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="font-extrabold text-xs text-amber-900">{rec.rating}.0</span>
                      </div>
                    </div>

                    {/* Tag Chips */}
                    {rec.selectedTags && rec.selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {rec.selectedTags.map((tag, idx) => (
                          <span 
                            key={idx} 
                            className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Written Comment */}
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                      "{rec.comment}"
                    </p>
                  </div>

                  {/* Bottom Row: User info, date & actions */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-700">
                        {rec.userName || 'Anonymous User'}
                      </span>
                      <span>•</span>
                      <span>{new Date(rec.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleHelpfulUpvote(rec.id)}
                        className="inline-flex items-center gap-1 text-slate-500 hover:text-emerald-600 transition-colors font-semibold"
                        title="Mark as helpful"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>{rec.helpfulCount}</span>
                      </button>

                      {isOwner && (
                        <>
                          <button
                            onClick={() => handleStartEdit(rec)}
                            className="text-slate-400 hover:text-blue-600 p-1"
                            title="Edit feedback"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(rec.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="Delete feedback"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickFeedbackWidget;
