import { useState } from 'react';
import { X, HelpCircle, Send, Tag, Sparkles, CheckCircle2, Calendar, ExternalLink } from 'lucide-react';
import { Question } from '../../data/communityData';
import { buildAppointmentUrl } from '../../utils/appointmentRedirect';

interface AskQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitQuestion: (newQuestion: Partial<Question>) => void;
  targetedExpertName?: string;
}

export function AskQuestionModal({
  isOpen,
  onClose,
  onSubmitQuestion,
  targetedExpertName
}: AskQuestionModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Income Tax');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorRole, setAuthorRole] = useState('Business Professional');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const parsedTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const defaultTags = parsedTags.length > 0 ? parsedTags : [category, 'Legal & Tax'];

    onSubmitQuestion({
      title: title.trim(),
      content: content.trim(),
      category,
      tags: defaultTags,
      author: {
        name: authorName.trim() || 'Community Member',
        role: authorRole
      }
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setTitle('');
      setContent('');
      setTagsInput('');
      setAuthorName('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">
                {targetedExpertName ? `Ask ${targetedExpertName}` : 'Ask a Professional Question'}
              </h3>
              <p className="text-xs text-slate-500">
                Get guidance from verified lawyers, chartered accountants & tax advisors
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-2">Question Published!</h4>
            <p className="text-sm text-slate-600 max-w-sm">
              Your inquiry has been shared with the Accounticca community and verified expert contributors.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
            {/* Confidential Consultation Referral to Appointment Portal */}
            <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  Need confidential 1-on-1 legal advice?
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Connect privately with {targetedExpertName || 'a corporate lawyer or tax specialist'}.
                </p>
              </div>
              <a
                href={buildAppointmentUrl({
                  lawyer: targetedExpertName,
                  service: category,
                  notes: title || content,
                  name: authorName,
                  source: 'Ask Question Modal Banner'
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-xs"
              >
                <span>Book Appointment</span>
                <ExternalLink className="w-3 h-3 text-emerald-200" />
              </a>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Question Headline *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. How does the new VAT Act affect e-commerce businesses in Bangladesh?"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
                >
                  <option value="Income Tax">Income Tax</option>
                  <option value="VAT & Customs">VAT & Customs</option>
                  <option value="Corporate Law">Corporate Law</option>
                  <option value="Company Registration">Company Registration</option>
                  <option value="Foreign Investment">Foreign Investment</option>
                  <option value="Legal Documentation">Legal Documentation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Topics / Tags (comma-separated)
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="VAT, E-commerce, Mushak 9.1"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Detailed Context & Specific Facts *
              </label>
              <textarea
                required
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Include relevant background such as turnover figures, company structure (sole proprietorship vs pvt ltd), SRO references, or court jurisdiction..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Your Name (or Business)
                </label>
                <input
                  id="ask-author-name"
                  name="name"
                  autoComplete="name"
                  type="text"
                  inputMode="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Rahim Uddin"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Your Professional Role
                </label>
                <input
                  id="ask-author-role"
                  name="organization-title"
                  autoComplete="organization-title"
                  type="text"
                  inputMode="text"
                  value={authorRole}
                  onChange={(e) => setAuthorRole(e.target.value)}
                  placeholder="e.g. Business Owner / CFO"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Reviewed by verified practitioners
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
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  Post Question
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
