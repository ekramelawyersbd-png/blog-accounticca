import React, { useState } from 'react';
import { 
  ThumbsUp, 
  Share2, 
  MessageCircle, 
  Check, 
  Copy, 
  ExternalLink, 
  Facebook,
  Sparkles
} from 'lucide-react';

interface FacebookPostEngageBarProps {
  postUrl?: string;
  initialLikes?: number;
  postTitle?: string;
  className?: string;
  variant?: 'dark' | 'light';
}

export function FacebookPostEngageBar({
  postUrl = 'https://www.facebook.com/photo/?fbid=1718531953613967&set=a.706589084808264',
  initialLikes = 184,
  postTitle = 'E-LAWYERS Official Facebook Post',
  className = '',
  variant = 'dark',
}: FacebookPostEngageBarProps) {
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLikeFeedback, setShowLikeFeedback] = useState(false);

  const encodedPostUrl = encodeURIComponent(postUrl);
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedPostUrl}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Check out this update from E-LAWYERS: ${postUrl}`
  )}`;

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!hasLiked) {
      setHasLiked(true);
      setLikesCount(prev => prev + 1);
      setShowLikeFeedback(true);
      setTimeout(() => setShowLikeFeedback(false), 3000);
    } else {
      setHasLiked(false);
      setLikesCount(prev => Math.max(initialLikes, prev - 1));
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (navigator.share) {
      try {
        await navigator.share({
          title: postTitle,
          text: 'Official post from E-LAWYERS & Accounticca Ecosystem:',
          url: postUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      window.open(facebookShareUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
    }
  };

  const isDark = variant === 'dark';

  return (
    <div className={`w-full mt-3 ${className}`}>
      {/* Action Row */}
      <div 
        className={`flex flex-wrap items-center justify-between gap-2 p-2 sm:p-2.5 rounded-xl border transition-all ${
          isDark 
            ? 'bg-slate-900/90 border-slate-800 text-slate-200' 
            : 'bg-white border-slate-200 text-slate-700 shadow-xs'
        }`}
      >
        {/* Left Side: Like & Engagement Feedback */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLikeClick}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
              hasLiked
                ? 'bg-[#1877F2] text-white shadow-[#1877F2]/30 scale-102 ring-2 ring-[#1877F2]/40'
                : isDark
                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
            }`}
            title="Like this update"
            aria-label="Like this post"
          >
            <ThumbsUp className={`w-3.5 h-3.5 transition-transform duration-300 ${hasLiked ? 'fill-current scale-110' : ''}`} />
            <span>{hasLiked ? 'Liked' : 'Like'}</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
              hasLiked ? 'bg-white/20 text-white' : isDark ? 'bg-slate-700/80 text-slate-300' : 'bg-slate-200 text-slate-600'
            }`}>
              {likesCount}
            </span>
          </button>

          {showLikeFeedback && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 animate-fade-in">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Thank you for liking!
            </span>
          )}
        </div>

        {/* Right Side: Share & Comment Actions */}
        <div className="flex items-center gap-1.5 relative">
          {/* Main Share Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowShareMenu(!showShareMenu)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                showShareMenu
                  ? 'bg-teal-600 text-white shadow-xs'
                  : isDark
                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
              }`}
              title="Share this post"
              aria-label="Share post"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            {/* Share Dropdown Menu */}
            {showShareMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowShareMenu(false)} 
                />
                <div 
                  className={`absolute right-0 bottom-full mb-2 w-56 rounded-2xl p-2 shadow-2xl border z-50 animate-in fade-in zoom-in-95 duration-150 ${
                    isDark 
                      ? 'bg-slate-950 border-slate-800 text-slate-100' 
                      : 'bg-white border-slate-200 text-slate-800 shadow-xl'
                  }`}
                >
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                    Share Post
                  </div>

                  <a
                    href={facebookShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowShareMenu(false)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                      isDark ? 'hover:bg-slate-900 text-slate-200 hover:text-white' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Facebook className="w-4 h-4 text-[#1877F2]" />
                    <span>Share on Facebook</span>
                  </a>

                  <a
                    href={whatsappShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowShareMenu(false)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                      isDark ? 'hover:bg-slate-900 text-slate-200 hover:text-white' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-[#25D366] text-white flex items-center justify-center text-[10px] font-bold">W</span>
                    <span>Share via WhatsApp</span>
                  </a>

                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                      type="button"
                      onClick={(e) => {
                        setShowShareMenu(false);
                        handleNativeShare(e);
                      }}
                      className={`w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        isDark ? 'hover:bg-slate-900 text-slate-200 hover:text-white' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Share2 className="w-4 h-4 text-emerald-400" />
                      <span>More Share Options...</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`w-full text-left flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-slate-900 text-slate-200 hover:text-white' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      <span>{copied ? 'Link Copied!' : 'Copy Direct Link'}</span>
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Comment / React directly on Facebook Link */}
          <a
            href={postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isDark
                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
            }`}
            title="Comment on this post on Facebook"
          >
            <MessageCircle className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Comment</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>
      </div>

      {/* Engagement Helper Footer */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 px-1 font-medium">
        <span>Like or share to spread verified legal & corporate compliance guidance</span>
        <a 
          href="https://facebook.com/elawyersbd" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-teal-400 hover:text-teal-300 hover:underline flex items-center gap-1"
        >
          Follow @elawyersbd
        </a>
      </div>
    </div>
  );
}
