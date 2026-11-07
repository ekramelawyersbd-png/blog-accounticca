import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeToArticleComments, 
  postProfessionalComment, 
  toggleEndorsement,
  CommentItem, 
  ProfessionalRole,
  PROFESSIONAL_ROLES, 
  DISCUSSION_TOPIC_TAGS 
} from '../services/commentService';
import { 
  MessageSquare, 
  ThumbsUp, 
  Send, 
  Loader2, 
  CornerDownRight, 
  Sparkles, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Facebook, 
  ExternalLink,
  Shield,
  HelpCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FacebookPostCommentsProps {
  contentId?: string;
  postUrl?: string;
  className?: string;
}

export function FacebookPostComments({
  contentId = 'facebook-post-1718531953613967',
  postUrl = 'https://www.facebook.com/photo/?fbid=1718531953613967&set=a.706589084808264',
  className = ''
}: FacebookPostCommentsProps) {
  const { user, signInWithGoogle } = useAuth();

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<'helpful' | 'latest'>('helpful');

  // New comment form state
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState(user?.displayName || '');
  const [organization, setOrganization] = useState('');
  const [selectedRole, setSelectedRole] = useState<ProfessionalRole>('corporate_counsel');
  const [selectedTopic, setSelectedTopic] = useState('Corporate Law & RJSC');
  const [replyText, setReplyText] = useState('');

  // Subscribe to real-time comments from Firestore
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToArticleComments(
      contentId,
      (updatedComments) => {
        setComments(updatedComments);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [contentId]);

  // Sync user display name if user logs in
  useEffect(() => {
    if (user?.displayName && !authorName) {
      setAuthorName(user.displayName);
    }
  }, [user, authorName]);

  // Separate top-level comments and replies
  const { topLevelComments, repliesMap } = useMemo(() => {
    const topLevel: CommentItem[] = [];
    const replies: Record<string, CommentItem[]> = {};

    comments.forEach((c) => {
      if (!c.parentId) {
        topLevel.push(c);
      } else {
        if (!replies[c.parentId]) {
          replies[c.parentId] = [];
        }
        replies[c.parentId].push(c);
      }
    });

    // Sort top level comments
    topLevel.sort((a, b) => {
      if (sortBy === 'helpful') {
        return (b.helpfulCount || 0) - (a.helpfulCount || 0);
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return { topLevelComments: topLevel, repliesMap: replies };
  }, [comments, sortBy]);

  const totalCommentsCount = comments.length;

  const handleVote = async (commentId: string) => {
    const currentVoted = !!userVotes[commentId];
    setUserVotes(prev => ({ ...prev, [commentId]: !currentVoted }));

    // Optimistic local state update
    setComments(prev => 
      prev.map(c => {
        if (c.id === commentId) {
          const newHelpful = currentVoted 
            ? Math.max(0, c.helpfulCount - 1) 
            : c.helpfulCount + 1;
          return { ...c, helpfulCount: newHelpful };
        }
        return c;
      })
    );

    await toggleEndorsement(contentId, commentId, currentVoted);
  };

  const handleSubmitComment = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    const textToSubmit = parentId ? replyText.trim() : commentText.trim();
    if (!textToSubmit) return;

    const resolvedAuthorName = user?.displayName || authorName.trim() || 'Practicing Counsel';
    const roleInfo = PROFESSIONAL_ROLES.find(r => r.value === selectedRole) || PROFESSIONAL_ROLES[0];

    setIsSubmitting(true);
    try {
      await postProfessionalComment({
        articleId: contentId,
        userId: user?.uid,
        authorName: resolvedAuthorName,
        authorEmail: user?.email || undefined,
        role: selectedRole,
        roleLabel: roleInfo.label,
        organization: organization.trim() || undefined,
        topicTag: selectedTopic,
        commentType: parentId ? 'insight' : 'insight',
        avatar: user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(resolvedAuthorName)}`,
        text: textToSubmit,
        parentId: parentId,
        isVerifiedProfessional: true
      });

      if (parentId) {
        setReplyText('');
        setReplyingToId(null);
      } else {
        setCommentText('');
      }
      setIsExpanded(true);
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCommentDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  return (
    <div className={`w-full mt-4 pt-4 border-t border-slate-800 text-left ${className}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Community Discussion</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-500/20 text-teal-300 font-mono">
                {totalCommentsCount}
              </span>
            </h4>
            <p className="text-[10px] text-slate-400">
              Insights &amp; queries from advocates &amp; entrepreneurs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => setSortBy('helpful')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                sortBy === 'helpful' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Top
            </button>
            <button
              type="button"
              onClick={() => setSortBy('latest')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                sortBy === 'latest' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Latest
            </button>
          </div>

          {/* External FB Link */}
          <a
            href={postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-[11px] text-teal-400 hover:text-teal-300 transition-colors"
            title="View discussion thread on Facebook"
          >
            <Facebook className="w-3 h-3 text-[#1877F2]" />
            <span>FB Thread</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      {/* Main Comment Input Box */}
      <form 
        onSubmit={(e) => handleSubmitComment(e, null)}
        className="bg-slate-900/90 rounded-2xl p-3 border border-slate-800 mb-3 shadow-inner focus-within:border-teal-500/50 transition-colors"
      >
        <div className="flex items-start gap-2.5 mb-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-teal-400 text-xs font-bold">
                {authorName ? authorName.charAt(0).toUpperCase() : 'C'}
              </div>
            )}
          </div>
          <div className="flex-1">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Join the discussion... Share a corporate query or legal note on this update"
              rows={2}
              className="w-full bg-slate-950/80 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 border border-slate-800 focus:outline-none focus:border-teal-500 resize-none"
            />
          </div>
        </div>

        {/* Input Details & Options (Collapsible or Shown when typing) */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {!user && (
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Your Name (e.g. Adv. Rahman)"
                className="bg-slate-950/60 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-200 placeholder-slate-500 border border-slate-800 focus:outline-none focus:border-teal-500"
              />
            )}

            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Chambers / Company (optional)"
              className="bg-slate-950/60 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-200 placeholder-slate-500 border border-slate-800 focus:outline-none focus:border-teal-500"
            />

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as ProfessionalRole)}
              className="bg-slate-950/60 rounded-lg px-2 py-1.5 text-[11px] text-slate-300 border border-slate-800 focus:outline-none focus:border-teal-500"
            >
              {PROFESSIONAL_ROLES.map((role) => (
                <option key={role.value} value={role.value} className="bg-slate-900 text-white">
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500">Topic:</span>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="bg-slate-950/40 rounded-md px-2 py-1 text-[10px] text-teal-300 border border-slate-800 focus:outline-none"
              >
                {DISCUSSION_TOPIC_TAGS.map((tag) => (
                  <option key={tag} value={tag} className="bg-slate-900 text-white">
                    {tag}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              {!user && (
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Sign in with Google
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !commentText.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>Post Comment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-2 py-2">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse bg-slate-900/60 rounded-xl p-3 border border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-slate-800" />
                <div className="w-24 h-3 bg-slate-800 rounded" />
              </div>
              <div className="w-full h-3 bg-slate-800/80 rounded mb-1" />
              <div className="w-3/4 h-3 bg-slate-800/80 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Comment Items List */}
      {!loading && topLevelComments.length === 0 && (
        <div className="text-center py-6 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
          <HelpCircle className="w-6 h-6 text-slate-500 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-slate-300">No discussions yet</p>
          <p className="text-[10px] text-slate-500">Be the first legal or business professional to comment!</p>
        </div>
      )}

      {!loading && topLevelComments.length > 0 && (
        <div className="space-y-2.5">
          {/* Display top comments or full list depending on isExpanded */}
          {(isExpanded ? topLevelComments : topLevelComments.slice(0, 2)).map((comment) => {
            const replies = repliesMap[comment.id] || [];
            const isVoted = !!userVotes[comment.id];

            return (
              <div 
                key={comment.id}
                className="bg-slate-900/80 rounded-2xl p-3 border border-slate-800/90 text-left hover:border-slate-700 transition-colors"
              >
                {/* Author Info */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <img 
                      src={comment.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName || 'Professional')}&background=0d9488&color=fff`} 
                      alt={comment.authorName} 
                      className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">
                          {comment.authorName}
                        </span>
                        {comment.isVerifiedProfessional && (
                          <span title="Verified Legal/Tax Professional" className="inline-flex">
                            <CheckCircle2 className="w-3 h-3 text-teal-400" />
                          </span>
                        )}
                        <span className="text-[9px] text-slate-400 font-mono">
                          • {formatCommentDate(comment.date)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 text-[10px]">
                        <span className="text-teal-300 font-medium">
                          {comment.roleLabel || 'Legal Practitioner'}
                        </span>
                        {comment.organization && (
                          <span className="text-slate-400">
                            • {comment.organization}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {comment.topicTag && (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-teal-950/80 text-teal-300 border border-teal-500/30 shrink-0">
                      {comment.topicTag}
                    </span>
                  )}
                </div>

                {/* Comment Text */}
                <p className="text-xs text-slate-200 leading-relaxed pl-9 mb-2 whitespace-pre-wrap">
                  {comment.text}
                </p>

                {/* Actions: Helpful, Reply, Statutory Ref */}
                <div className="flex items-center justify-between pl-9 pt-1.5 border-t border-slate-800/60 text-[10px]">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleVote(comment.id)}
                      className={`inline-flex items-center gap-1.5 font-bold transition-colors cursor-pointer ${
                        isVoted ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <ThumbsUp className={`w-3 h-3 ${isVoted ? 'fill-current' : ''}`} />
                      <span>{comment.helpfulCount > 0 ? `${comment.helpfulCount} Helpful` : 'Helpful'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                      className="text-slate-400 hover:text-white font-semibold transition-colors cursor-pointer"
                    >
                      Reply
                    </button>
                  </div>

                  {comment.statutoryRef && (
                    <span className="text-[9px] text-slate-400 italic">
                      Ref: {comment.statutoryRef}
                    </span>
                  )}
                </div>

                {/* Inline Reply Form */}
                {replyingToId === comment.id && (
                  <form 
                    onSubmit={(e) => handleSubmitComment(e, comment.id)}
                    className="mt-2.5 pl-9 pt-2 border-t border-slate-800 animate-in fade-in"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Reply to ${comment.authorName}...`}
                        className="flex-1 bg-slate-950 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 border border-slate-700 focus:outline-none focus:border-teal-500"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting || !replyText.trim()}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => { setReplyingToId(null); setReplyText(''); }}
                        className="px-2 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Nested Threaded Replies */}
                {replies.length > 0 && (
                  <div className="mt-2.5 pl-8 space-y-2 border-l-2 border-teal-500/20 ml-4">
                    {replies.map((reply) => {
                      const isReplyVoted = !!userVotes[reply.id];
                      return (
                        <div key={reply.id} className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80">
                          <div className="flex items-center gap-2 mb-1">
                            <CornerDownRight className="w-3 h-3 text-teal-400 shrink-0" />
                            <img 
                              src={reply.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.authorName || 'Professional')}&background=0d9488&color=fff`} 
                              alt={reply.authorName} 
                              className="w-5 h-5 rounded-full object-cover border border-slate-700" 
                            />
                            <span className="text-xs font-bold text-white">
                              {reply.authorName}
                            </span>
                            <span className="text-[9px] text-teal-400 font-medium">
                              ({reply.roleLabel})
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono ml-auto">
                              {formatCommentDate(reply.date)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-200 pl-5 mb-1.5">
                            {reply.text}
                          </p>
                          <div className="pl-5 flex items-center justify-between text-[9px] text-slate-400">
                            <button
                              type="button"
                              onClick={() => handleVote(reply.id)}
                              className={`inline-flex items-center gap-1 font-bold cursor-pointer ${
                                isReplyVoted ? 'text-teal-400' : 'hover:text-slate-200'
                              }`}
                            >
                              <ThumbsUp className={`w-2.5 h-2.5 ${isReplyVoted ? 'fill-current' : ''}`} />
                              <span>{reply.helpfulCount > 0 ? `${reply.helpfulCount} Helpful` : 'Helpful'}</span>
                            </button>
                            {reply.statutoryRef && (
                              <span className="italic">Ref: {reply.statutoryRef}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Expand / Collapse Toggle if more than 2 comments */}
          {topLevelComments.length > 2 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-teal-300 hover:text-teal-200 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-800 transition-colors cursor-pointer"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Show fewer comments</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>View all {topLevelComments.length} discussion threads</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Footer Info Notice */}
      <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 px-1">
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-teal-500" />
          Real-time synchronized with compliance cloud database
        </span>
        <span className="flex items-center gap-1 text-slate-400">
          <Sparkles className="w-2.5 h-2.5 text-amber-400" />
          Verified Practitioners
        </span>
      </div>
    </div>
  );
}
