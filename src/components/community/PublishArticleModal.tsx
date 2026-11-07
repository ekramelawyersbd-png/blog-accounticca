import { useState } from 'react';
import { X, PenTool, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';

interface PublishArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PublishArticleModal({ isOpen, onClose }: PublishArticleModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Corporate Law');
  const [outline, setOutline] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Publish Legal / Tax Insights</h3>
              <p className="text-xs text-slate-500">Build your authority and reach 10,000+ professionals</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-2">Article Draft Submitted!</h4>
            <p className="text-sm text-slate-600 max-w-xs mb-3">
              Our legal editorial desk will review your submission for statutory citations and feature it under your verified profile.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Article Title / Case Analysis *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Critical Amendments to Tax Deducted at Source (TDS) under Finance Act"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Primary Domain *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                >
                  <option value="Corporate Law">Corporate Law</option>
                  <option value="Income Tax">Income Tax</option>
                  <option value="VAT & Customs">VAT & Customs</option>
                  <option value="Foreign Investment">Foreign Investment</option>
                  <option value="Startup Legalities">Startup Legalities</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Author Byline
                </label>
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Advocate Aminul Islam"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Key Summary / Outline *
              </label>
              <textarea
                required
                rows={4}
                value={outline}
                onChange={(e) => setOutline(e.target.value)}
                placeholder="Provide a brief synopsis or paste your article draft here. Include relevant statutory sections, SRO numbers, or court citations..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                Published to 10k+ subscribers
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                >
                  Submit for Editorial Review
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
