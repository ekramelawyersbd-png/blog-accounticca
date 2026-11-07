import { useState } from 'react';
import { Linkedin, Facebook, Mail, Copy, Check, Share2 } from 'lucide-react';
import { cn } from '../lib/utils';

// Standard official WhatsApp icon
function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.004 0C5.378 0 .008 5.37.008 12c0 2.115.55 4.183 1.597 6.002L.004 24l6.195-1.626C8.016 23.364 9.98 24 12.004 24c6.626 0 11.996-5.37 11.996-12S18.63 0 12.004 0zm0 21.84c-1.802 0-3.568-.485-5.112-1.402l-.367-.218-3.676.964.981-3.584-.239-.38C2.65 15.65 2.16 13.856 2.16 12 2.16 6.574 6.578 2.16 12.004 2.16c5.426 0 9.84 4.414 9.84 9.84s-4.414 9.84-9.84 9.84z"/>
      <path d="M17.472 14.382c-.301-.15-1.782-.88-2.057-.98-.275-.1-.475-.15-.675.15-.2.3-.775.98-.95 1.18-.175.2-.35.225-.65.075-.3-.15-1.267-.467-2.414-1.49-.893-.796-1.496-1.78-1.671-2.08-.175-.3-.019-.462.131-.611.136-.134.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525s-.675-1.625-.925-2.225c-.244-.585-.492-.505-.675-.514-.175-.009-.375-.009-.575-.009s-.525.075-.8.375c-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.115 3.23 5.124 4.53.715.31 1.273.495 1.708.634.718.228 1.371.196 1.888.118.577-.087 1.782-.728 2.033-1.43.25-.702.25-1.303.175-1.43-.075-.127-.275-.202-.575-.352z"/>
    </svg>
  );
}

// Modern official X (Twitter) icon
function XTwitterIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export interface SocialShareButtonsProps {
  url?: string;
  title: string;
  summary?: string;
  variant?: 'top-bar' | 'bottom-bar' | 'floating-rail' | 'sidebar-card' | 'compact' | 'full' | 'banner';
  className?: string;
}

export function SocialShareButtons({
  url,
  title,
  summary,
  variant = 'compact',
  className = '',
}: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  // Derive target URL
  const shareUrl = typeof window !== 'undefined' 
    ? (url ? (url.startsWith('http') ? url : `${window.location.origin}${url}`) : window.location.href) 
    : '';
  const shareTitle = title || 'Compliance Hub Legal & Tax Insights';
  const shareText = summary 
    ? `${shareTitle} — ${summary}` 
    : `${shareTitle} | Essential Bangladesh Legal, Tax & Corporate Intelligence`;

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(shareTitle);
  const encodedText = encodeURIComponent(shareText);

  const shareLinks = {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    }
  };

  // 1. Top Social Sharing Bar: Prominent, sleek bar with explicit LinkedIn, Facebook, WhatsApp, X, and Copy Link buttons
  if (variant === 'top-bar') {
    return (
      <div 
        id="top-article-social-share-bar"
        aria-label="Article social sharing bar (top)"
        className={cn(
          "bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:px-5 sm:py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition-colors",
          className
        )}
      >
        {/* Label with professional context */}
        <div className="flex items-center gap-2.5 text-slate-800 font-semibold text-xs sm:text-sm">
          <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 leading-tight">Share this Article</div>
            <div className="text-[11px] text-slate-500 font-normal leading-tight hidden sm:block">LinkedIn, Facebook &amp; Professional Networks</div>
          </div>
        </div>

        {/* Buttons Row with clear branding */}
        <div className="flex flex-wrap items-center gap-2">
          {/* LinkedIn */}
          <a
            id="top-share-linkedin-btn"
            href={shareLinks.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            title="Share on LinkedIn"
            aria-label="Share on LinkedIn"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0A66C2] hover:bg-[#084e96] shadow-xs hover:shadow transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <Linkedin className="w-3.5 h-3.5 shrink-0" />
            <span>LinkedIn</span>
          </a>

          {/* Facebook */}
          <a
            id="top-share-facebook-btn"
            href={shareLinks.facebook}
            target="_blank"
            rel="noopener noreferrer"
            title="Share on Facebook"
            aria-label="Share on Facebook"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#1877F2] hover:bg-[#0d65d9] shadow-xs hover:shadow transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <Facebook className="w-3.5 h-3.5 shrink-0" />
            <span>Facebook</span>
          </a>

          {/* WhatsApp */}
          <a
            id="top-share-whatsapp-btn"
            href={shareLinks.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            title="Share via WhatsApp"
            aria-label="Share via WhatsApp"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#25D366] hover:bg-[#1faa52] shadow-xs hover:shadow transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 shrink-0" />
            <span>WhatsApp</span>
          </a>

          {/* X / Twitter */}
          <a
            id="top-share-twitter-btn"
            href={shareLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            title="Post on X (Twitter)"
            aria-label="Post on X (Twitter)"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-black shadow-xs hover:shadow transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <XTwitterIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Post</span>
          </a>

          {/* Copy Link Button */}
          <div className="relative">
            <button
              id="top-share-copy-btn"
              type="button"
              onClick={handleCopyLink}
              title="Copy link to clipboard"
              aria-label="Copy link to clipboard"
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 border cursor-pointer",
                copied
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
              )}
            >
              {copied ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
              <span>{copied ? "Copied!" : "Copy Link"}</span>
            </button>
            {copied && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[11px] font-medium px-2 py-1 rounded shadow-lg whitespace-nowrap z-30 pointer-events-none animate-in fade-in zoom-in-95">
                Link copied to clipboard!
              </div>
            )}
          </div>

          {/* Native Share button if supported on mobile/tablet */}
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              type="button"
              onClick={handleNativeShare}
              title="Share using your device"
              aria-label="Share using your device"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">More</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. Floating Rail variant: Docked on the left side of desktop screen as reader scrolls
  if (variant === 'floating-rail') {
    return (
      <aside 
        id="floating-article-share-rail"
        aria-label="Floating social sharing rail"
        className={cn(
          "fixed left-3 2xl:left-5 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-center gap-2 p-2 w-auto max-w-fit bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-lg ring-1 ring-slate-900/5 animate-in fade-in duration-500",
          className
        )}
      >
        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 pt-0.5 pb-0.5 select-none">
          Share
        </span>

        {/* LinkedIn */}
        <a
          id="rail-share-linkedin-btn"
          href={shareLinks.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          title="Share on LinkedIn"
          aria-label="Share on LinkedIn"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white bg-[#0A66C2] hover:bg-[#084e96] hover:scale-105 active:scale-95 shadow-xs transition-all duration-150 cursor-pointer group relative"
        >
          <Linkedin className="w-4 h-4 shrink-0" />
          <span className="absolute left-full ml-2.5 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
            Share on LinkedIn
          </span>
        </a>

        {/* Facebook */}
        <a
          id="rail-share-facebook-btn"
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          title="Share on Facebook"
          aria-label="Share on Facebook"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white bg-[#1877F2] hover:bg-[#0d65d9] hover:scale-105 active:scale-95 shadow-xs transition-all duration-150 cursor-pointer group relative"
        >
          <Facebook className="w-4 h-4 shrink-0" />
          <span className="absolute left-full ml-2.5 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
            Share on Facebook
          </span>
        </a>

        {/* WhatsApp */}
        <a
          id="rail-share-whatsapp-btn"
          href={shareLinks.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          title="Share via WhatsApp"
          aria-label="Share via WhatsApp"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white bg-[#25D366] hover:bg-[#1faa52] hover:scale-105 active:scale-95 shadow-xs transition-all duration-150 cursor-pointer group relative"
        >
          <WhatsAppIcon className="w-4 h-4 shrink-0" />
          <span className="absolute left-full ml-2.5 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
            Share via WhatsApp
          </span>
        </a>

        {/* X / Twitter */}
        <a
          id="rail-share-twitter-btn"
          href={shareLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          title="Post on X (Twitter)"
          aria-label="Post on X (Twitter)"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white bg-slate-900 hover:bg-black hover:scale-105 active:scale-95 shadow-xs transition-all duration-150 cursor-pointer group relative"
        >
          <XTwitterIcon className="w-4 h-4 shrink-0" />
          <span className="absolute left-full ml-2.5 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
            Post on X
          </span>
        </a>

        <div className="w-5 h-px bg-slate-200 my-0.5" />

        {/* Copy Link */}
        <div className="relative group">
          <button
            id="rail-share-copy-btn"
            type="button"
            onClick={handleCopyLink}
            title="Copy article link"
            aria-label="Copy article link"
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer",
              copied 
                ? "bg-emerald-600 text-white" 
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            )}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <span className="absolute left-full ml-2.5 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
            {copied ? "Link Copied!" : "Copy Link"}
          </span>
        </div>

        {/* Email */}
        <a
          id="rail-share-email-btn"
          href={shareLinks.email}
          title="Email Article"
          aria-label="Email Article"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer group relative"
        >
          <Mail className="w-4 h-4 shrink-0" />
          <span className="absolute left-full ml-2.5 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
            Send via Email
          </span>
        </a>
      </aside>
    );
  }

  // 3. Sidebar Card variant: Perfect for sidebars with 2-column branded buttons
  if (variant === 'sidebar-card') {
    return (
      <div className={cn("space-y-2.5", className)}>
        <div className="grid grid-cols-2 gap-2">
          {/* LinkedIn */}
          <a
            href={shareLinks.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-[#0A66C2] hover:bg-[#084e96] transition-all shadow-2xs hover:shadow-xs active:scale-95"
          >
            <Linkedin className="w-3.5 h-3.5 shrink-0" />
            <span>LinkedIn</span>
          </a>

          {/* Facebook */}
          <a
            href={shareLinks.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-[#1877F2] hover:bg-[#0d65d9] transition-all shadow-2xs hover:shadow-xs active:scale-95"
          >
            <Facebook className="w-3.5 h-3.5 shrink-0" />
            <span>Facebook</span>
          </a>

          {/* WhatsApp */}
          <a
            href={shareLinks.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-[#25D366] hover:bg-[#1faa52] transition-all shadow-2xs hover:shadow-xs active:scale-95"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 shrink-0" />
            <span>WhatsApp</span>
          </a>

          {/* X */}
          <a
            href={shareLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-black transition-all shadow-2xs hover:shadow-xs active:scale-95"
          >
            <XTwitterIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Post on X</span>
          </a>
        </div>

        {/* Copy Link full button */}
        <button
          type="button"
          onClick={handleCopyLink}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all border",
            copied
              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
          )}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
          <span>{copied ? "Link Copied to Clipboard!" : "Copy Article Link"}</span>
        </button>
      </div>
    );
  }

  // 4. Compact variant for simple icon rows
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
        {/* LinkedIn */}
        <a
          href={shareLinks.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          title="Share on LinkedIn"
          aria-label="Share on LinkedIn"
          className="p-2 text-white bg-[#0A66C2] hover:bg-[#084e96] rounded-xl transition-all duration-150 active:scale-95 shadow-xs"
        >
          <Linkedin className="w-4 h-4" />
        </a>

        {/* Facebook */}
        <a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          title="Share on Facebook"
          aria-label="Share on Facebook"
          className="p-2 text-white bg-[#1877F2] hover:bg-[#0d65d9] rounded-xl transition-all duration-150 active:scale-95 shadow-xs"
        >
          <Facebook className="w-4 h-4" />
        </a>

        {/* WhatsApp */}
        <a
          href={shareLinks.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          title="Share via WhatsApp"
          aria-label="Share via WhatsApp"
          className="p-2 text-white bg-[#25D366] hover:bg-[#1faa52] rounded-xl transition-all duration-150 active:scale-95 shadow-xs"
        >
          <WhatsAppIcon className="w-4 h-4" />
        </a>

        {/* X / Twitter */}
        <a
          href={shareLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          title="Share on X (Twitter)"
          aria-label="Share on X (Twitter)"
          className="p-2 text-white bg-slate-900 hover:bg-black rounded-xl transition-all duration-150 active:scale-95 shadow-xs"
        >
          <XTwitterIcon className="w-4 h-4" />
        </a>

        {/* Copy Link */}
        <div className="relative">
          <button
            onClick={handleCopyLink}
            type="button"
            title="Copy link to clipboard"
            aria-label="Copy link to clipboard"
            className={cn(
              "p-2 rounded-xl transition-all duration-150 flex items-center justify-center border",
              copied 
                ? "bg-emerald-600 text-white border-emerald-600" 
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            )}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          {copied && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[11px] font-medium px-2 py-1 rounded shadow-lg whitespace-nowrap z-30 pointer-events-none animate-in fade-in zoom-in-95">
              Link copied!
            </div>
          )}
        </div>
      </div>
    );
  }

  // 5. Default: Bottom Social Media Sharing & Networking Card
  return (
    <div 
      id="bottom-article-social-share-bar"
      aria-label="Professional social sharing card"
      className={cn(
        "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-6 sm:p-8 my-10 border border-slate-800/80 shadow-xl relative overflow-hidden",
        className
      )}
    >
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Legal &amp; Regulatory Insight</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Found this statutory analysis helpful?
            </h3>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Disseminate this guide to your partners, clients, and colleagues to help them navigate Bangladesh tax &amp; compliance requirements.
            </p>
          </div>
        </div>

        {/* Prominent branded action buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          {/* LinkedIn */}
          <a
            id="bottom-share-linkedin-btn"
            href={shareLinks.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            title="Share on LinkedIn"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold text-white bg-[#0A66C2] hover:bg-[#084e96] hover:scale-[1.02] active:scale-95 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <Linkedin className="w-4 h-4 shrink-0" />
            <span>LinkedIn</span>
          </a>

          {/* Facebook */}
          <a
            id="bottom-share-facebook-btn"
            href={shareLinks.facebook}
            target="_blank"
            rel="noopener noreferrer"
            title="Share on Facebook"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold text-white bg-[#1877F2] hover:bg-[#0d65d9] hover:scale-[1.02] active:scale-95 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <Facebook className="w-4 h-4 shrink-0" />
            <span>Facebook</span>
          </a>

          {/* WhatsApp */}
          <a
            id="bottom-share-whatsapp-btn"
            href={shareLinks.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            title="Share via WhatsApp"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold text-white bg-[#25D366] hover:bg-[#1faa52] hover:scale-[1.02] active:scale-95 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <WhatsAppIcon className="w-4 h-4 shrink-0" />
            <span>WhatsApp</span>
          </a>

          {/* X / Twitter */}
          <a
            id="bottom-share-twitter-btn"
            href={shareLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            title="Post on X (Twitter)"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:scale-[1.02] active:scale-95 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <XTwitterIcon className="w-4 h-4 shrink-0" />
            <span>Post on X</span>
          </a>

          {/* Copy Link */}
          <div className="col-span-2 sm:col-span-1 relative">
            <button
              id="bottom-share-copy-btn"
              type="button"
              onClick={handleCopyLink}
              title="Copy link"
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold hover:scale-[1.02] active:scale-95 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border",
                copied
                  ? "bg-emerald-600 text-white border-emerald-500"
                  : "bg-white/10 hover:bg-white/20 text-white border-white/10"
              )}
            >
              {copied ? <Check className="w-4 h-4 shrink-0" /> : <Copy className="w-4 h-4 shrink-0" />}
              <span>{copied ? "Link Copied!" : "Copy Link"}</span>
            </button>
            {copied && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-emerald-600 text-white text-[11px] font-medium px-3 py-1 rounded shadow-lg whitespace-nowrap z-30 pointer-events-none animate-in fade-in zoom-in-95">
                Link copied to clipboard!
              </div>
            )}
          </div>
        </div>

        {/* Secondary options: Email & Device Native Share */}
        <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-700/60 text-xs text-slate-400">
          <span className="hidden sm:inline">Direct one-click sharing across platforms</span>
          <div className="flex items-center gap-4 ml-auto">
            <a
              href={shareLinks.email}
              className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email this guide</span>
            </a>
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Device Share</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
