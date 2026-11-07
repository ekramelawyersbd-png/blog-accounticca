import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Download, 
  Search, 
  Eye, 
  Copy, 
  Check, 
  ShieldCheck, 
  Scale, 
  FileCheck2, 
  Briefcase, 
  Users, 
  Sparkles, 
  ArrowRight,
  BookOpen,
  FolderDown,
  Building2,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Filter,
  Info,
  Calendar
} from 'lucide-react';
import { ServiceSEO } from '../components/SEO';
import { RESOURCE_TEMPLATES, ResourceTemplate } from '../data/resourceTemplates';
import { generateTemplatePDF } from '../utils/resourcePdfGenerator';

type CategoryFilter = 'All' | 'Legal Contracts' | 'Tax & Compliance' | 'Corporate & RJSC' | 'Employment & HR';

export function ResourceLibraryPage() {
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
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <ServiceSEO
        title="Resource Library (PDFs) & Statutory Legal Templates | Accounticca & E-Lawyers"
        description="Download ready-to-use, compliant legal agreements, statutory tax checklists, RJSC board resolutions, and HR contracts governed by Bangladesh law."
        serviceType="Legal & Tax Resource Library"
        canonicalUrl="/resource-library"
        keywords={[
          'Resource Library Bangladesh',
          'Legal Agreement PDF Download',
          'NDA Template Bangladesh',
          'Tax Return Checklist PDF',
          'RJSC Resolution Template',
          'Employment Contract Bangladesh',
          'Consultancy Agreement PDF'
        ]}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Resources', url: '/tools' },
          { name: 'Resource Library (PDFs)', url: '/resource-library' }
        ]}
      />

      {/* Floating Status Notification */}
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium">{statusMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-b from-emerald-50/70 via-white to-slate-50 text-slate-900 pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200/80">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-bold uppercase tracking-wider mb-4">
                <FolderDown className="w-3.5 h-3.5 text-emerald-600" />
                <span>Statutory Legal & Tax Documentation Vault</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                Resource Library <span className="text-emerald-600 font-black">(PDFs)</span>
              </h1>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                Download verified, practitioner-grade legal draft templates, corporate resolutions, employment contracts, and statutory tax checklists customized for Bangladesh law (Contract Act 1872, Income Tax Act 2023, Companies Act 1994, and Labour Act 2006).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/tools"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 transition-all shadow-xs"
              >
                <span>Interactive Calculators</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/training"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm hover:shadow-emerald-600/30"
              >
                <span>Academy Courses &amp; Workshops</span>
                <Sparkles className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-2">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="text-2xl font-black text-emerald-600">{RESOURCE_TEMPLATES.length}+</div>
              <div className="text-xs text-slate-600 font-medium mt-0.5">Compliant Drafts</div>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="text-2xl font-black text-slate-900">100% Free</div>
              <div className="text-xs text-slate-600 font-medium mt-0.5">One-Click PDF Export</div>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="text-2xl font-black text-emerald-600">AY 2026-27</div>
              <div className="text-xs text-slate-600 font-medium mt-0.5">Updated Tax SROs</div>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="text-2xl font-black text-slate-900">Full Text</div>
              <div className="text-xs text-slate-600 font-medium mt-0.5">Editable & Copyable</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        {/* Search & Filter Toolbar Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-200/90 mb-8">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search resources by title, keywords (e.g. NDA, Section 166, RJSC, HR, tax checklist)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium text-slate-800"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 p-1"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Featured NBR Official Publications Banner */}
        <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Income Tax Guidelines Card */}
          <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md flex flex-col justify-between">
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-extrabold uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  NBR Official Manual
                </span>
                <span className="text-xs text-indigo-200/80 font-bold">AY 2026-2027</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-2 leading-tight">
                আয়কর নির্দেশিকা ২০২৬-২০২৭
              </h3>
              <p className="text-sm text-indigo-200/90 leading-relaxed mb-6">
                Official step-by-step practical guide issued by NBR for individual tax return submission, deduction slabs, and universal e-filing.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 relative z-10">
              <a 
                href="https://pub-1d8caf41922f46e1952565fc23269fb3.r2.dev/%E0%A6%86%E0%A7%9F%E0%A6%95%E0%A6%B0%20%E0%A6%A8%E0%A6%BF%E0%A6%B0%E0%A7%8D%E0%A6%A6%E0%A7%87%E0%A6%B6%E0%A6%BF%E0%A6%95%E0%A6%BE%20%E0%A7%A8%E0%A7%A6%E0%A7%A8%E0%A7%AC-%E0%A7%A8%E0%A7%A6%E0%A7%A8%E0%A7%AD.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download Official PDF
              </a>
              <Link
                to="/article/income-tax-guidelines-2026-2027-pdf-download"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all border border-white/10"
              >
                <span>Read Analysis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Income Tax Circular Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md flex flex-col justify-between">
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[11px] font-extrabold uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  Statutory Circular
                </span>
                <span className="text-xs text-slate-300 font-bold">Finance Act 2026</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-2 leading-tight">
                আয়কর পরিপত্র ২০২৬-২০২৭
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Statutory circular on legal amendments, TDS rates, corporate taxation slabs, and procedural compliance rules.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 relative z-10">
              <a 
                href="https://pub-1d8caf41922f46e1952565fc23269fb3.r2.dev/%E0%A6%86%E0%A7%9F%E0%A6%95%E0%A6%B0_%E0%A6%AA%E0%A6%B0%E0%A6%BF%E0%A6%AA%E0%A6%A4%E0%A7%8D%E0%A6%B0_%E0%A7%A8%E0%A7%A6%E0%A7%A8%E0%A7%AC-%E0%A7%A8%E0%A7%A6%E0%A7%A8%E0%A7%AD.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download Official PDF
              </a>
              <Link
                to="/article/income-tax-circular-2026-2027-pdf-download"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all border border-white/10"
              >
                <span>Read Circular Breakdown</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Templates Grid Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Downloadable Templates ({filteredTemplates.length})
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Select any document below to generate high-resolution, print-ready PDF or copy raw clause drafts.
            </p>
          </div>
          <span className="hidden sm:inline-flex text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Governed by Bangladesh Laws
          </span>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">No templates matched your search</h3>
            <p className="text-sm text-slate-500 mb-4">
              Try searching with different terms like "NDA", "tax", "consultancy", or reset the filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => {
              const isDownloading = downloadingId === template.id;
              const isCopied = copiedId === template.id;

              return (
                <div
                  key={template.id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col p-5 group"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
                        {getCategoryIcon(template.category)}
                      </div>
                      <div>
                        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          {template.category}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {template.fileSizeEstimate}
                        </span>
                      </div>
                    </div>
                    {template.badge && (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {template.badge}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-800 transition-colors mb-1.5 leading-snug">
                    {template.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mb-2 line-clamp-1">
                    {template.subtitle}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4 flex-1 line-clamp-3">
                    {template.description}
                  </p>

                  {/* Governing Law Tag */}
                  <div className="mb-4 pt-3 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mb-1">
                      Statutory Framework
                    </span>
                    <span className="text-[11px] font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-md inline-block border border-slate-100 truncate max-w-full">
                      {template.governingLaw}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleDownload(template)}
                      disabled={isDownloading}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
                      <span>{isDownloading ? 'Generating...' : 'Download PDF'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewTemplate(template)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                      title="Preview draft clauses"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyText(template)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                      title="Copy full text"
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legal Disclaimer Box */}
        <div className="mt-14 bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 sm:p-6 text-amber-900">
          <div className="flex items-start gap-3.5">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm leading-relaxed space-y-1">
              <span className="font-bold block text-amber-950">
                Notice Regarding Legal &amp; Compliance Templates
              </span>
              <p className="text-amber-900/90">
                These templates are provided by <strong>Accounticca × E-Lawyers Bangladesh</strong> for informational and general transactional guidance. Because every commercial transaction and corporate profile is unique, we strongly advise having custom contracts reviewed by qualified legal and tax counsel prior to execution.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                  {previewTemplate.category}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {previewTemplate.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Governing Law: {previewTemplate.governingLaw}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm leading-relaxed">
              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 text-xs text-emerald-900">
                <span className="font-bold">Template Overview: </span>
                {previewTemplate.description}
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Key Clauses Included:
                </h4>
                {previewTemplate.sections.map((sec, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                    <h5 className="font-bold text-slate-900 text-xs mb-2">{sec.heading}</h5>
                    {Array.isArray(sec.content) ? (
                      <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                        {sec.content.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-600">{sec.content}</p>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                  Full Document Preview:
                </h4>
                <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {previewTemplate.fullText}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleCopyText(previewTemplate)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedId === previewTemplate.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Full Text</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(previewTemplate)}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
