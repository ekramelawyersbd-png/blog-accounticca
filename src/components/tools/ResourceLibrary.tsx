import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Download, 
  Search, 
  Eye, 
  Copy, 
  Check, 
  X, 
  ShieldCheck, 
  Scale, 
  FileCheck2, 
  Briefcase, 
  Users, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { RESOURCE_TEMPLATES, ResourceTemplate } from '../../data/resourceTemplates';
import { generateTemplatePDF } from '../../utils/resourcePdfGenerator';

type CategoryFilter = 'All' | 'Legal Contracts' | 'Tax & Compliance' | 'Corporate & RJSC' | 'Employment & HR';

export function ResourceLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<ResourceTemplate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const categories: CategoryFilter[] = [
    'All',
    'Legal Contracts',
    'Tax & Compliance',
    'Corporate & RJSC',
    'Employment & HR'
  ];

  const filteredTemplates = RESOURCE_TEMPLATES.filter((template) => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      query === '' ||
      template.title.toLowerCase().includes(query) ||
      template.subtitle.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      template.tags.some((tag) => tag.toLowerCase().includes(query)) ||
      template.governingLaw.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  const handleDownload = (template: ResourceTemplate) => {
    setDownloadingId(template.id);
    try {
      generateTemplatePDF(template);
      setStatusMessage(`Downloaded "${template.title}.pdf" successfully!`);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      setStatusMessage('Error creating PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCopyText = (template: ResourceTemplate) => {
    navigator.clipboard.writeText(template.fullText);
    setCopiedId(template.id);
    setStatusMessage('Template text copied to clipboard!');
    setTimeout(() => {
      setCopiedId(null);
      setStatusMessage(null);
    }, 2500);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Legal Contracts':
        return <Scale className="w-4 h-4 text-indigo-600" />;
      case 'Tax & Compliance':
        return <FileCheck2 className="w-4 h-4 text-emerald-600" />;
      case 'Corporate & RJSC':
        return <Briefcase className="w-4 h-4 text-blue-600" />;
      case 'Employment & HR':
        return <Users className="w-4 h-4 text-purple-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div id="resource-library" className="scroll-mt-10">
      {/* Toast Notification */}
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium">{statusMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-8 sm:p-10 text-white shadow-xl mb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Downloadable Legal & Tax Hub
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-3 tracking-tight">
            Resource Library: Legal & Tax Templates
          </h2>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-6">
            Download print-ready PDF templates and editable drafts for common legal and tax documents in Bangladesh. Prepared in compliance with the Contract Act 1872, Income Tax Act 2023, and Labour Act 2006.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300 mb-6">
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Bangladeshi Jurisdiction Tested</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              <Download className="w-4 h-4 text-blue-400" />
              <span>Instant PDF & Editable Text</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              <FileCheck2 className="w-4 h-4 text-amber-400" />
              <span>Assessment Year 2026-27 Compliant</span>
            </div>
          </div>
          <div>
            <Link
              to="/resource-library"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all"
            >
              <span>Open Dedicated Resource Library Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="resource-search-input"
            type="text"
            placeholder="Search by name or tag (e.g. NDA, TDS, VAT)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              id="clear-resource-search-btn"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200/60 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Real-time Search Feedback Bar */}
      {searchQuery.trim() !== '' && (
        <div className="flex items-center justify-between px-2 py-1.5 mb-6 text-xs text-slate-600 bg-slate-100/70 rounded-xl border border-slate-200/60">
          <span>
            Found <strong className="text-slate-900 font-semibold">{filteredTemplates.length}</strong> {filteredTemplates.length === 1 ? 'template' : 'templates'} matching &ldquo;<span className="text-indigo-600 font-medium">{searchQuery}</span>&rdquo;
          </span>
          <button
            onClick={() => setSearchQuery('')}
            className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">No templates found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
            No document templates match your query "{searchQuery}". Try searching for NDA, service agreement, tax checklist, or clear filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Header info */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
                    {getCategoryIcon(template.category)}
                    <span>{template.category}</span>
                  </div>
                  {template.badge && (
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-[11px] font-semibold">
                      {template.badge}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-900 transition-colors mb-1">
                  {template.title}
                </h3>
                <p className="text-xs text-indigo-600 font-medium mb-3">
                  {template.subtitle}
                </p>

                {/* Description */}
                <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-3">
                  {template.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {template.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchQuery(tag);
                      }}
                      title={`Filter by tag "${tag}"`}
                      className={`px-2 py-0.5 border rounded text-[11px] font-medium transition-all ${
                        searchQuery.toLowerCase() === tag.toLowerCase()
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 hover:bg-indigo-50 border-slate-200/60 hover:border-indigo-200 text-slate-600 hover:text-indigo-700'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                  <span>{template.fileSizeEstimate}</span>
                  <span>{template.governingLaw.split('&')[0]}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDownload(template)}
                    disabled={downloadingId === template.id}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {downloadingId === template.id ? 'Building...' : 'Download PDF'}
                  </button>

                  <button
                    onClick={() => setPreviewTemplate(template)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold rounded-xl transition-all active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview & Copy
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/50">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-xs font-semibold mb-2">
                  {previewTemplate.category} • {previewTemplate.fileSizeEstimate}
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {previewTemplate.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Governing Law: {previewTemplate.governingLaw}
                </p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Document Preview */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-900 text-slate-200 font-mono text-xs leading-relaxed selection:bg-emerald-500 selection:text-white">
              <pre className="whitespace-pre-wrap font-mono">
                {previewTemplate.fullText}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                You can copy the text into Microsoft Word or Google Docs, or download as a formatted PDF.
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyText(previewTemplate)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors"
                >
                  {copiedId === previewTemplate.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Text
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDownload(previewTemplate)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
