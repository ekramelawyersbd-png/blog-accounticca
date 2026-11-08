import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Download, 
  Search, 
  Check, 
  ShieldCheck, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Info, 
  Filter,
  Settings,
  Plus,
  RefreshCw
} from 'lucide-react';
import { ServiceSEO } from '../components/SEO';
import { ResourceTemplate } from '../data/resourceTemplates';
import { RegulatoryDocument } from '../data/regulatoryLibraryData';
import { getRegulatoryDocuments, getResourceTemplates } from '../services/regulatoryLibraryService';
import { useShopAuth, getStoredAdminToken } from '../contexts/ShopAuthContext';
import { generateTemplatePDF } from '../utils/resourcePdfGenerator';

type TimeFilterOption = 'All' | 'This Month' | 'Last 6 Months' | 'Last Year';
type MainTabOption = 'regulatory' | 'templates';

export function ResourceLibraryPage() {
  // Admin Auth Check
  let isAdminLoggedIn = false;
  try {
    const auth = useShopAuth();
    isAdminLoggedIn = Boolean(auth?.isAuthenticated || auth?.adminUser);
  } catch {
    isAdminLoggedIn = Boolean(getStoredAdminToken());
  }
  // Navigation View Tab
  const [activeTab, setActiveTab] = useState<MainTabOption>('regulatory');

  // Dynamic Datasets State
  const [docs, setDocs] = useState<RegulatoryDocument[]>([]);
  const [templates, setTemplates] = useState<ResourceTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Top Controls State
  const [timeFilter, setTimeFilter] = useState<TimeFilterOption>('All');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sidebar Filter State
  const [selectedAuthority, setSelectedAuthority] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Template State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [previewTemplate, setPreviewTemplate] = useState<ResourceTemplate | null>(null);
  const [previewDoc, setPreviewDoc] = useState<RegulatoryDocument | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Fetch dynamic dataset from Service
  const loadLibraryData = async () => {
    setLoading(true);
    try {
      const [fetchedDocs, fetchedTemplates] = await Promise.all([
        getRegulatoryDocuments(),
        getResourceTemplates(),
      ]);
      setDocs(fetchedDocs);
      setTemplates(fetchedTemplates);
    } catch (err) {
      console.error('Failed loading regulatory library items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibraryData();
  }, []);

  const authoritiesList = [
    { name: 'Bangladesh Bank', code: 'bb' },
    { name: 'NBR', code: 'nbr' },
    { name: 'BIDA', code: 'bida' },
    { name: 'RJSC', code: 'rjsc' },
    { name: 'BSEC', code: 'bsec' },
    { name: 'Others', code: 'others' }
  ];

  const yearsList = [2026, 2025, 2024, 2023, 2022, 2021];

  // Reset All Filters
  const handleClearFilters = () => {
    setTimeFilter('All');
    setDateFilter('');
    setSearchQuery('');
    setSelectedAuthority('All');
    setSelectedYear(null);
    setSelectedCategory('All');
  };

  // Compute Authority Counts for Regulatory Documents
  const authorityCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Bangladesh Bank': 0,
      'NBR': 0,
      'BIDA': 0,
      'RJSC': 0,
      'BSEC': 0,
      'Others': 0
    };

    docs.forEach((doc) => {
      if (doc.authority.includes('Bangladesh Bank')) counts['Bangladesh Bank']++;
      else if (doc.authority.includes('National Board of Revenue') || doc.authority.includes('NBR')) counts['NBR']++;
      else if (doc.authority.includes('BIDA')) counts['BIDA']++;
      else if (doc.authority.includes('RJSC')) counts['RJSC']++;
      else if (doc.authority.includes('BSEC')) counts['BSEC']++;
      else counts['Others']++;
    });

    return counts;
  }, [docs]);

  // Filtered Regulatory Documents
  const filteredRegulatoryDocs = useMemo(() => {
    return docs.filter((doc) => {
      let matchesAuth = true;
      if (selectedAuthority !== 'All') {
        if (selectedAuthority === 'Bangladesh Bank') matchesAuth = doc.authority.includes('Bangladesh Bank');
        else if (selectedAuthority === 'NBR') matchesAuth = doc.authority.includes('National Board of Revenue') || doc.authority.includes('NBR');
        else if (selectedAuthority === 'BIDA') matchesAuth = doc.authority.includes('BIDA');
        else if (selectedAuthority === 'RJSC') matchesAuth = doc.authority.includes('RJSC');
        else if (selectedAuthority === 'BSEC') matchesAuth = doc.authority.includes('BSEC');
        else if (selectedAuthority === 'Others') matchesAuth = doc.authorityCode === 'others' || doc.authority.includes('Ministry of Law');
      }

      const matchesYear = selectedYear === null || doc.year === selectedYear;
      const matchesDate = !dateFilter || doc.docDate === dateFilter;

      let matchesTime = true;
      if (timeFilter !== 'All') {
        const docD = new Date(doc.docDate);
        const now = new Date('2026-11-08');
        if (timeFilter === 'This Month') {
          matchesTime = docD.getMonth() === now.getMonth() && docD.getFullYear() === now.getFullYear();
        } else if (timeFilter === 'Last 6 Months') {
          const sixMonthsAgo = new Date(now);
          sixMonthsAgo.setMonth(now.getMonth() - 6);
          matchesTime = docD >= sixMonthsAgo;
        } else if (timeFilter === 'Last Year') {
          matchesTime = docD.getFullYear() === now.getFullYear() - 1 || doc.year === 2025;
        }
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        doc.authority.toLowerCase().includes(q) ||
        doc.docNo.toLowerCase().includes(q) ||
        doc.description.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q) ||
        doc.docDate.includes(q);

      return matchesAuth && matchesYear && matchesDate && matchesTime && matchesSearch;
    });
  }, [docs, selectedAuthority, selectedYear, dateFilter, timeFilter, searchQuery]);

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        template.title.toLowerCase().includes(q) ||
        template.subtitle.toLowerCase().includes(q) ||
        template.description.toLowerCase().includes(q) ||
        template.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        template.governingLaw.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  const handleDownloadTemplate = (template: ResourceTemplate) => {
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

  const categories = [
    'All',
    'Legal Contracts',
    'Tax & Compliance',
    'Corporate & RJSC',
    'Employment & HR'
  ];

  return (
    <div className="min-h-screen bg-[#F4F7F9] font-sans pb-20 text-[#333333]">
      <ServiceSEO
        title="Regulatory Library - Forms, SROs & Legal Templates | E-Lawyers & Accounticca"
        description="Collection of major notifications, SROs, circulars, and orders issued by regulatory authorities in Bangladesh including Bangladesh Bank, NBR, BIDA, RJSC, BSEC, and Ministry of Law."
        serviceType="Regulatory & Legal Documentation Library"
        canonicalUrl="/resource-library"
        keywords={[
          'Regulatory Library Bangladesh',
          'Bangladesh Bank Circulars 2026',
          'NBR Income Tax SROs',
          'RJSC eBRS Circulars',
          'BIDA Foreign Investment Instructions',
          'BSEC Corporate Governance Code',
          'Legal Contract Templates PDF'
        ]}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Resources', url: '/tools' },
          { name: 'Regulatory Library', url: '/resource-library' }
        ]}
      />

      {/* Floating Status Notification */}
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0A2A66] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-blue-400 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium">{statusMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6 sm:p-8">
          
          {/* Header Section */}
          <header className="mb-6 pb-4 border-b border-[#E5E7EB]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div>
                <div className="flex flex-wrap items-baseline gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                    Regulatory Library
                  </h1>
                  <h2 className="text-xl sm:text-2xl font-semibold text-[#1A5BB8]">
                    Forms &amp; Templates
                  </h2>
                </div>
              </div>

              {/* Action Buttons: View Switcher & Admin Portal Trigger */}
              <div className="flex items-center gap-2 shrink-0">
                {isAdminLoggedIn && (
                  <Link
                    to="/admin/regulatory-library"
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-[#0A2A66] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    title="Open Admin Management Desk to add/edit circulars"
                  >
                    <Settings className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Admin Desk</span>
                  </Link>
                )}

                <div className="flex items-center gap-1 bg-[#F4F7F9] p-1 rounded-xl border border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('regulatory')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeTab === 'regulatory'
                        ? 'bg-[#0A2A66] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Circulars ({docs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('templates')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeTab === 'templates'
                        ? 'bg-[#0A2A66] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Templates ({templates.length})
                  </button>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-500 max-w-4xl leading-relaxed">
              Welcome to our regulatory library where you can find a collection of major notifications/SROs/orders/circulars issued by various regulatory authorities in Bangladesh (Bangladesh Bank, NBR, BIDA, RJSC, BSEC, Ministry of Law).
            </p>
          </header>

          {/* Top Controls */}
          <div className="bg-[#F4F7F9] p-3.5 sm:p-4 rounded-xl border border-[#E5E7EB] mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {(['All', 'This Month', 'Last 6 Months', 'Last Year'] as TimeFilterOption[]).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeFilter(tf)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    timeFilter === tf
                      ? 'bg-[#0A2A66] text-white border-[#0A2A66] shadow-xs'
                      : 'bg-white text-slate-700 border-[#E5E7EB] hover:bg-slate-50'
                  }`}
                >
                  {tf}
                </button>
              ))}

              <div className="relative">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-1.5 pr-8 bg-white border border-[#E5E7EB] rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#1A5BB8]"
                  title="Filter by specific date"
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="relative w-full sm:w-72 md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search your items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs sm:text-sm font-medium focus:outline-none focus:border-[#1A5BB8] focus:ring-2 focus:ring-[#1A5BB8]/20 transition-all text-slate-900"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
            
            {/* Sidebar Filters */}
            <aside className="border border-[#E5E7EB] rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="bg-[#0A2A66] text-white px-4 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-blue-300" />
                  <h3 className="text-sm font-bold">Filter Options</h3>
                </div>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="bg-[#E2E8F0] hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer"
                >
                  Clear
                </button>
              </div>

              {/* Authority Filter */}
              <div className="p-4 border-b border-[#E5E7EB] space-y-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-900 mb-2">
                  <span>Filter By Authority</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>

                <div
                  onClick={() => setSelectedAuthority('All')}
                  className={`flex items-center justify-between py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedAuthority === 'All' ? 'bg-blue-50 text-[#1A5BB8] font-bold' : 'text-slate-700 hover:text-[#1A5BB8]'
                  }`}
                >
                  <span>All Authorities</span>
                  <span className="text-slate-400 font-mono">({docs.length})</span>
                </div>

                {authoritiesList.map((auth) => {
                  const count = authorityCounts[auth.name] || 0;
                  const isSelected = selectedAuthority === auth.name;

                  return (
                    <div
                      key={auth.code}
                      onClick={() => setSelectedAuthority(auth.name)}
                      className={`flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition cursor-pointer ${
                        isSelected ? 'bg-blue-50 text-[#1A5BB8] font-bold' : 'text-slate-700 hover:text-[#1A5BB8]'
                      }`}
                    >
                      <span>{auth.name}</span>
                      <span className="text-slate-400 text-[11px] font-mono flex items-center gap-1">
                        ({count}) <ChevronDown className="w-3 h-3 text-slate-300" />
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Year Filter */}
              <div className="p-4 border-b border-[#E5E7EB]">
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-900 mb-2">
                  <span>Filter by Year</span>
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                </div>

                <div className="grid grid-cols-3 gap-1.5 mt-2">
                  {yearsList.map((yr) => {
                    const isSelected = selectedYear === yr;

                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setSelectedYear(isSelected ? null : yr)}
                        className={`py-1.5 px-2 rounded border text-xs font-semibold transition cursor-pointer text-center ${
                          isSelected
                            ? 'bg-[#0A2A66] text-white border-[#0A2A66]'
                            : 'bg-white text-slate-700 border-[#E5E7EB] hover:bg-[#F4F7F9]'
                        }`}
                      >
                        {yr}
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* Main Table / Grid Area */}
            <main>
              {activeTab === 'regulatory' ? (
                <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl shadow-2xs bg-white">
                  <table className="w-full text-left border-collapse min-w-[850px]">
                    <thead className="bg-[#0A2A66] text-white border-b border-blue-900">
                      <tr>
                        <th className="py-3.5 px-4 text-xs font-extrabold text-white tracking-wider w-[22%]">Authority</th>
                        <th className="py-3.5 px-4 text-xs font-extrabold text-white tracking-wider w-[25%]">Document No.</th>
                        <th className="py-3.5 px-4 text-xs font-extrabold text-white tracking-wider w-[15%]">Document Date</th>
                        <th className="py-3.5 px-4 text-xs font-extrabold text-white tracking-wider w-[38%]">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB] text-xs sm:text-sm">
                      {filteredRegulatoryDocs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-slate-500">
                            <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="font-bold text-slate-700">No regulatory documents match your current filter</p>
                            <button
                              type="button"
                              onClick={handleClearFilters}
                              className="mt-3 px-3.5 py-1.5 bg-[#0A2A66] text-white text-xs font-bold rounded-lg transition"
                            >
                              Reset All Filters
                            </button>
                          </td>
                        </tr>
                      ) : (
                        filteredRegulatoryDocs.map((doc) => (
                          <tr key={doc.id} className="hover:bg-[#F9FAFB] transition-colors">
                            <td className="py-4 px-4 font-semibold text-slate-900 align-top">
                              {doc.authority}
                            </td>
                            <td className="py-4 px-4 align-top">
                              {doc.pdfUrl ? (
                                <a
                                  href={doc.pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#1A5BB8] hover:underline font-bold inline-flex items-center gap-1"
                                >
                                  <span>{doc.docNo}</span>
                                  <Download className="w-3 h-3 text-emerald-600 shrink-0" />
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setPreviewDoc(doc)}
                                  className="text-[#1A5BB8] hover:underline font-bold text-left cursor-pointer"
                                >
                                  {doc.docNo}
                                </button>
                              )}
                            </td>
                            <td className="py-4 px-4 text-slate-600 font-mono text-xs align-top whitespace-nowrap">
                              {doc.docDate}
                            </td>
                            <td className="py-4 px-4 text-slate-700 leading-relaxed align-top">
                              {doc.description}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {template.category}
                          </span>
                          {template.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {template.badge}
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-bold text-slate-900 mb-1">
                          {template.title}
                        </h4>
                        <p className="text-xs text-[#1A5BB8] font-semibold mb-2">
                          {template.subtitle}
                        </p>
                        <p className="text-xs text-slate-600 line-clamp-3 mb-3 leading-relaxed">
                          {template.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono text-slate-500">
                          {template.fileSizeEstimate}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewTemplate(template)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition cursor-pointer"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadTemplate(template)}
                            disabled={downloadingId === template.id}
                            className="px-3.5 py-1.5 bg-[#0A2A66] hover:bg-[#1A5BB8] text-white text-xs font-bold rounded-lg transition shadow-2xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>{downloadingId === template.id ? 'Exporting...' : 'PDF'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Doc Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded bg-blue-100 text-[#0A2A66]">
                  {previewDoc.authority}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {previewDoc.docNo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <div className="flex items-center justify-between font-mono bg-slate-50 p-2.5 rounded-xl text-xs">
                <span>Issue Date: <strong className="text-slate-900">{previewDoc.docDate}</strong></span>
                <span>Category: <strong className="text-[#1A5BB8]">{previewDoc.category}</strong></span>
              </div>

              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-slate-900 font-medium">
                {previewDoc.description}
              </div>

              {previewDoc.details && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">Statutory Scope:</span>
                  <p className="text-slate-600 text-xs leading-relaxed">{previewDoc.details}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResourceLibraryPage;
