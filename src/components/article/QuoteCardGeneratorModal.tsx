import { useState, useRef } from 'react';
import { Sparkles, Download, Copy, Check, X, Quote, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';
import html2canvas from 'html2canvas';

interface QuoteCardGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuote: string;
  articleTitle: string;
  articleAuthor?: string;
  articleUrl?: string;
}

type CardTheme = 'emerald' | 'navy' | 'sepia' | 'minimal';

export function QuoteCardGeneratorModal({
  isOpen,
  onClose,
  initialQuote,
  articleTitle,
  articleAuthor = 'Advocate Ekramul Hoque',
  articleUrl = window.location.href,
}: QuoteCardGeneratorModalProps) {
  const [quote, setQuote] = useState(initialQuote);
  const [theme, setTheme] = useState<CardTheme>('emerald');
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    setFeedback(null);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `compliance-hub-quote-${Date.now()}.png`;
      link.click();
      setFeedback('Quote card downloaded successfully!');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error('Failed to generate image:', err);
      setFeedback('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    setFeedback(null);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error('Canvas blob is null');
        }
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setFeedback('Quote card copied to clipboard!');
        setTimeout(() => setFeedback(null), 3000);
      });
    } catch (err) {
      console.error('Failed to copy image:', err);
      // Fallback to downloading
      handleDownload();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(`"${quote}"\n\n— ${articleTitle}\nRead more: ${articleUrl}`);
    setFeedback('Quote text copied to clipboard!');
    setTimeout(() => setFeedback(null), 3000);
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`"${quote}"\n\n— via ${articleTitle}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(articleUrl)}`, '_blank');
  };

  const shareToLinkedin = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`, '_blank');
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`, '_blank');
  };

  const themeClasses: Record<CardTheme, { bg: string; text: string; accent: string; border: string }> = {
    emerald: {
      bg: 'bg-gradient-to-br from-emerald-900 via-slate-900 to-emerald-950 text-white',
      text: 'text-emerald-100',
      accent: 'text-emerald-400',
      border: 'border-emerald-500/30'
    },
    navy: {
      bg: 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 text-white',
      text: 'text-blue-100',
      accent: 'text-blue-400',
      border: 'border-blue-500/30'
    },
    sepia: {
      bg: 'bg-[#fbf7f0] text-[#2d2216]',
      text: 'text-[#4a3b2c]',
      accent: 'text-[#b8860b]',
      border: 'border-[#e6d5bc]'
    },
    minimal: {
      bg: 'bg-white text-slate-900',
      text: 'text-slate-700',
      accent: 'text-emerald-600',
      border: 'border-slate-200 shadow-xl'
    }
  };

  const currentTheme = themeClasses[theme];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Shareable Quote Card</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Generate a branded graphic quote for social media platforms</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body / Preview Area */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Theme Selector */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Card Theme:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTheme('emerald')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${theme === 'emerald' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
              >
                Emerald Pro
              </button>
              <button
                type="button"
                onClick={() => setTheme('navy')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${theme === 'navy' ? 'bg-blue-900 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
              >
                Midnight Navy
              </button>
              <button
                type="button"
                onClick={() => setTheme('sepia')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${theme === 'sepia' ? 'bg-[#e6d5bc] text-[#2d2216] shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
              >
                Warm Sepia
              </button>
              <button
                type="button"
                onClick={() => setTheme('minimal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${theme === 'minimal' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
              >
                Clean Minimal
              </button>
            </div>
          </div>

          {/* Editable Quote Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Quote Text:</label>
            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Card Preview Container */}
          <div className="flex justify-center p-2 bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div
              ref={cardRef}
              className={`w-full max-w-lg p-8 rounded-2xl border ${currentTheme.bg} ${currentTheme.border} shadow-2xl relative flex flex-col justify-between min-h-[320px] transition-all`}
            >
              {/* Top watermark / branding */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${theme === 'sepia' ? 'bg-[#b8860b]' : 'bg-emerald-500'}`} />
                  <span className="text-xs font-bold tracking-widest uppercase opacity-80">E-Lawyers & Compliance Hub</span>
                </div>
                <Quote className={`w-8 h-8 opacity-20 ${currentTheme.accent}`} />
              </div>

              {/* Quote Content */}
              <div className="my-auto py-4">
                <p className={`text-lg sm:text-xl font-serif italic leading-relaxed ${currentTheme.text}`}>
                  &ldquo;{quote}&rdquo;
                </p>
              </div>

              {/* Footer info */}
              <div className="pt-6 border-t border-current/10 flex items-center justify-between gap-4 mt-6">
                <div>
                  <p className="text-xs font-bold">{articleAuthor}</p>
                  <p className="text-[11px] opacity-70 line-clamp-1">{articleTitle}</p>
                </div>
                <div className="text-[10px] font-mono opacity-60 tracking-wider">
                  elawyersbd.com
                </div>
              </div>
            </div>
          </div>

          {feedback && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={shareToTwitter}
              title="Share on Twitter / X"
              className="p-2 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors cursor-pointer"
            >
              <Twitter className="w-4 h-4" />
            </button>
            <button
              onClick={shareToLinkedin}
              title="Share on LinkedIn"
              className="p-2 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors cursor-pointer"
            >
              <Linkedin className="w-4 h-4" />
            </button>
            <button
              onClick={shareToFacebook}
              title="Share on Facebook"
              className="p-2 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors cursor-pointer"
            >
              <Facebook className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopyText}
              title="Copy Quote Text"
              className="px-3 py-2 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Text</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyImage}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 transition-colors text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Image</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Generating...' : 'Download PNG'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
