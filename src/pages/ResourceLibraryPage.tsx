import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  Eye,
  Search,
  Copy,
  Check,
  X,
  Scale,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  Filter,
  Settings,
  Bookmark,
  ArrowUpDown,
  FileSpreadsheet,
  Printer,
  BookOpen,
  FileCheck2,
  Building2,
  ArrowRight,
} from 'lucide-react';
import {
  RESOURCE_TEMPLATES,
  ResourceTemplate,
} from '../data/resourceTemplates';
import {
  REGULATORY_DOCUMENTS,
  REGULATORY_CATEGORIES,
  RegulatoryDocument,
} from '../data/regulatoryLibraryData';
import {
  getRegulatoryDocuments,
  getResourceTemplates,
} from '../services/regulatoryLibraryService';
import { generateTemplatePDF } from '../utils/resourcePdfGenerator';
import { useShopAuth, getStoredAdminToken } from '../contexts/ShopAuthContext';

type TimeFilterOption = 'All' | 'This Month' | 'Last 6 Months' | 'Last Year';
type MainTabOption = 'regulatory' | 'templates';
type SortOption = 'date-desc' | 'date-asc' | 'authority' | 'docNo';

const TEMPLATE_CATEGORIES = [
  'All',
  'Legal Contracts',
  'Tax & Compliance',
  'Corporate & RJSC',
  'Employment & HR',
] as const;

const BOOKMARKS_STORAGE_KEY = 'e_lawyers_bookmarked_reg_docs_v1';

export function ResourceLibraryPage() {
  useEffect(() => {
    document.title =
      'Regulatory Library | Circulars, SRO 273 TDS 2026 & Legal Templates | E-Lawyers Bangladesh';
  }, []);

  const { adminUser, isAuthenticated } = useShopAuth();
  const [hasAdminToken, setHasAdminToken] = useState<boolean>(false);

  useEffect(() => {
    setHasAdminToken(Boolean(getStoredAdminToken()));
  }, [adminUser, isAuthenticated]);

  const isAdminLoggedIn = Boolean((isAuthenticated && adminUser) || hasAdminToken);

  // Main View Switcher
  const [activeTab, setActiveTab] = useState<MainTabOption>('regulatory');

  // Dynamic Datasets State
  const [docsList, setDocsList] = useState<RegulatoryDocument[]>(REGULATORY_DOCUMENTS);
  const [templatesList, setTemplatesList] = useState<ResourceTemplate[]>(RESOURCE_TEMPLATES);

  // Bookmarks State
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getRegulatoryDocuments(), getResourceTemplates()])
      .then(([loadedDocs, loadedTemplates]) => {
        if (isMounted) {
          setDocsList(loadedDocs);
          setTemplatesList(loadedTemplates);
        }
      })
      .catch((err) => console.error('Failed loading dynamic regulatory items:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  // Top Controls State
  const [timeFilter, setTimeFilter] = useState<TimeFilterOption>('All');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  // Left Sidebar Filter State
  const [selectedAuthority, setSelectedAuthority] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedDocCategory, setSelectedDocCategory] = useState<string>('All');
  const [authorityExpanded, setAuthorityExpanded] = useState<boolean>(true);
  const [yearExpanded, setYearExpanded] = useState<boolean>(true);

  // Templates & Modals State
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<string>('All');
  const [previewTemplate, setPreviewTemplate] = useState<ResourceTemplate | null>(null);
  const [previewDoc, setPreviewDoc] = useState<RegulatoryDocument | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3200);
  };

  // Authorities definition
  const authoritiesList = [
    { name: 'National Board of Revenue (NBR)', shortName: 'NBR (Income Tax, VAT & Customs)', code: 'nbr' },
    { name: 'Bangladesh Bank', shortName: 'Bangladesh Bank (FEPD / BRPD)', code: 'bb' },
    { name: 'RJSC', shortName: 'RJSC (Company Registry)', code: 'rjsc' },
    { name: 'BIDA', shortName: 'BIDA (Investment Authority)', code: 'bida' },
    { name: 'BSEC', shortName: 'BSEC (Securities Commission)', code: 'bsec' },
    { name: 'Ministry of Law', shortName: 'Ministry of Law & Parliament', code: 'law' },
    { name: 'Others', shortName: 'Other Statutory Bodies', code: 'others' },
  ];

  const yearsList = [2026, 2025, 2024, 2023, 2022, 2021];

  // Clear all filters
  const handleClearFilters = () => {
    setTimeFilter('All');
    setDateFilter('');
    setSearchQuery('');
    setSelectedAuthority('All');
    setSelectedYear(null);
    setSelectedDocCategory('All');
    setSelectedTemplateCategory('All');
    setShowBookmarkedOnly(false);
    setSortBy('date-desc');
  };

  // Compute authority counts dynamically
  const authorityCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'National Board of Revenue (NBR)': 0,
      'Bangladesh Bank': 0,
      RJSC: 0,
      BIDA: 0,
      BSEC: 0,
      'Ministry of Law': 0,
      Others: 0,
    };

    docsList.forEach((doc) => {
      if (doc.authority.includes('Bangladesh Bank')) counts['Bangladesh Bank']++;
      else if (doc.authority.includes('National Board of Revenue') || doc.authority.includes('NBR'))
        counts['National Board of Revenue (NBR)']++;
      else if (doc.authority.includes('BIDA')) counts['BIDA']++;
      else if (doc.authority.includes('RJSC')) counts['RJSC']++;
      else if (doc.authority.includes('BSEC')) counts['BSEC']++;
      else if (doc.authority.includes('Ministry of Law')) counts['Ministry of Law']++;
      else counts['Others']++;
    });

    return counts;
  }, [docsList]);

  // Compute year counts dynamically
  const yearCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    yearsList.forEach((y) => {
      counts[y] = 0;
    });
    docsList.forEach((doc) => {
      counts[doc.year] = (counts[doc.year] || 0) + 1;
    });
    return counts;
  }, [docsList]);

  // Compute category counts dynamically
  const docCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: docsList.length };
    REGULATORY_CATEGORIES.forEach((c) => {
      if (c !== 'All') counts[c] = 0;
    });
    docsList.forEach((doc) => {
      counts[doc.category] = (counts[doc.category] || 0) + 1;
    });
    return counts;
  }, [docsList]);

  // Pinned Spotlight Documents
  const pinnedDocs = useMemo(() => {
    return docsList.filter((d) => d.isPinned).slice(0, 4);
  }, [docsList]);

  // Filter & Sort Regulatory Documents
  const filteredRegulatoryDocs = useMemo(() => {
    const filtered = docsList.filter((doc) => {
      // 1. Authority Filter
      let matchesAuth = true;
      if (selectedAuthority !== 'All') {
        if (selectedAuthority === 'Bangladesh Bank') {
          matchesAuth = doc.authority.includes('Bangladesh Bank');
        } else if (selectedAuthority === 'National Board of Revenue (NBR)') {
          matchesAuth =
            doc.authority.includes('National Board of Revenue') || doc.authority.includes('NBR');
        } else if (selectedAuthority === 'BIDA') {
          matchesAuth = doc.authority.includes('BIDA');
        } else if (selectedAuthority === 'RJSC') {
          matchesAuth = doc.authority.includes('RJSC');
        } else if (selectedAuthority === 'BSEC') {
          matchesAuth = doc.authority.includes('BSEC');
        } else if (selectedAuthority === 'Ministry of Law') {
          matchesAuth = doc.authority.includes('Ministry of Law');
        } else if (selectedAuthority === 'Others') {
          matchesAuth = doc.authorityCode === 'others';
        }
      }

      // 2. Year Filter
      const matchesYear = selectedYear === null || doc.year === selectedYear;

      // 3. Doc Category Filter
      const matchesCategory =
        selectedDocCategory === 'All' || doc.category === selectedDocCategory;

      // 4. Bookmarks Filter
      const matchesBookmark = !showBookmarkedOnly || bookmarkedIds.includes(doc.id);

      // 5. Exact Date Filter
      const matchesDate = !dateFilter || doc.docDate === dateFilter;

      // 6. Time Range Button Filter
      let matchesTime = true;
      if (timeFilter !== 'All') {
        const docD = new Date(doc.docDate);
        const now = new Date('2026-07-25');
        if (timeFilter === 'This Month') {
          matchesTime =
            docD.getMonth() === now.getMonth() && docD.getFullYear() === now.getFullYear();
        } else if (timeFilter === 'Last 6 Months') {
          const sixMonthsAgo = new Date(now);
          sixMonthsAgo.setMonth(now.getMonth() - 6);
          matchesTime = docD >= sixMonthsAgo;
        } else if (timeFilter === 'Last Year') {
          matchesTime = doc.year === 2025;
        }
      }

      // 7. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        doc.authority.toLowerCase().includes(q) ||
        doc.docNo.toLowerCase().includes(q) ||
        doc.description.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q) ||
        (doc.details && doc.details.toLowerCase().includes(q)) ||
        doc.docDate.includes(q);

      return (
        matchesAuth &&
        matchesYear &&
        matchesCategory &&
        matchesBookmark &&
        matchesDate &&
        matchesTime &&
        matchesSearch
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'date-desc') {
        return b.docDate.localeCompare(a.docDate);
      }
      if (sortBy === 'date-asc') {
        return a.docDate.localeCompare(b.docDate);
      }
      if (sortBy === 'authority') {
        return a.authority.localeCompare(b.authority);
      }
      if (sortBy === 'docNo') {
        return a.docNo.localeCompare(b.docNo);
      }
      return 0;
    });
  }, [
    docsList,
    selectedAuthority,
    selectedYear,
    selectedDocCategory,
    showBookmarkedOnly,
    bookmarkedIds,
    dateFilter,
    timeFilter,
    searchQuery,
    sortBy,
  ]);

  // Filter Templates
  const filteredTemplates = useMemo(() => {
    return templatesList.filter((template) => {
      const matchesCategory =
        selectedTemplateCategory === 'All' || template.category === selectedTemplateCategory;
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
  }, [templatesList, selectedTemplateCategory, searchQuery]);

  const handleDownloadTemplate = (template: ResourceTemplate) => {
    setDownloadingId(template.id);
    try {
      generateTemplatePDF(template);
      showToast(`Downloaded "${template.title}.pdf" successfully`);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      showToast('Error creating PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCopyText = (template: ResourceTemplate) => {
    navigator.clipboard.writeText(template.fullText);
    setCopiedId(template.id);
    showToast('Template clause text copied to clipboard');
    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  const handleCopyCitation = (doc: RegulatoryDocument) => {
    const citation = `${doc.authority} — ${doc.docNo} (Issued: ${doc.docDate}): ${doc.description}`;
    navigator.clipboard.writeText(citation);
    setCopiedId(doc.id);
    showToast(`Copied statutory citation for ${doc.docNo}`);
    setTimeout(() => {
      setCopiedId(null);
    }, 2200);
  };

  const handleExportCSV = () => {
    const headers = ['Authority', 'Category', 'Document No', 'Issue Date', 'Year', 'Description'];
    const rows = filteredRegulatoryDocs.map((d) => [
      `"${d.authority.replace(/"/g, '""')}"`,
      `"${d.category}"`,
      `"${d.docNo.replace(/"/g, '""')}"`,
      `"${d.docDate}"`,
      `"${d.year}"`,
      `"${d.description.replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bangladesh-regulatory-library-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredRegulatoryDocs.length} regulatory records to CSV`);
  };

  const activeFilterCount =
    (selectedAuthority !== 'All' ? 1 : 0) +
    (selectedYear !== null ? 1 : 0) +
    (selectedDocCategory !== 'All' ? 1 : 0) +
    (timeFilter !== 'All' ? 1 : 0) +
    (dateFilter ? 1 : 0) +
    (showBookmarkedOnly ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20 font-sans">
      {/* Toast Notification */}
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0A2A66] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-blue-400/40 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{statusMessage}</span>
        </div>
      )}

      {/* Institutional Top Banner */}
      <div className="bg-[#0A2A66] text-white border-b border-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-xs font-medium text-blue-200 mb-3">
                <Link to="/" className="hover:text-white transition">
                  Home
                </Link>
                <span>/</span>
                <span className="text-white font-semibold">Regulatory Library</span>
              </nav>

              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                  Regulatory Library
                </h1>
                <span className="text-sm sm:text-lg font-semibold text-amber-300">
                  Statutory Gazette Archive &amp; Legal Templates
                </span>
              </div>

              <p className="text-xs sm:text-sm text-blue-100/90 max-w-3xl mt-2.5 leading-relaxed">
                Authoritative repository of Bangladesh Bank (FEPD/BRPD) circulars, National Board of
                Revenue (NBR) SROs &amp; Paripatras, RJSC eBRS directives, BIDA investment guidelines,
                and statutory corporate compliance templates for Assessment Year 2026–2027.
              </p>
            </div>

            {/* Primary View Switcher & Utility Actions */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-1 bg-blue-950/80 p-1 rounded-xl border border-blue-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('regulatory')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap tabular-nums ${
                    activeTab === 'regulatory'
                      ? 'bg-white text-[#0A2A66] shadow-xs'
                      : 'text-blue-100 hover:text-white'
                  }`}
                >
                  Circulars &amp; SROs ({docsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('templates')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap tabular-nums ${
                    activeTab === 'templates'
                      ? 'bg-white text-[#0A2A66] shadow-xs'
                      : 'text-blue-100 hover:text-white'
                  }`}
                >
                  Legal Templates ({templatesList.length})
                </button>
              </div>

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Export filtered regulatory table to CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Print current regulatory index"
              >
                <Printer className="w-3.5 h-3.5 text-blue-200" />
                <span className="hidden sm:inline">Print</span>
              </button>

              {isAdminLoggedIn && (
                <Link
                  to="/admin/regulatory-library"
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                  title="Manage Regulatory Library (Admin CRUD)"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Admin Desk</span>
                </Link>
              )}
            </div>
          </div>

          {/* Statutory Metrics Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-7 pt-6 border-t border-blue-800/70">
            <div className="bg-blue-950/50 border border-blue-800/80 rounded-xl px-4 py-3">
              <span className="text-[11px] font-medium text-blue-200 block">
                Indexed Gazette Instruments
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl sm:text-2xl font-black text-white font-mono tabular-nums">
                  {docsList.length}
                </span>
                <span className="text-[11px] font-semibold text-emerald-300">2021–2026</span>
              </div>
            </div>

            <div className="bg-blue-950/50 border border-blue-800/80 rounded-xl px-4 py-3">
              <span className="text-[11px] font-medium text-blue-200 block">
                NBR &amp; Bangladesh Bank
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl sm:text-2xl font-black text-white font-mono tabular-nums">
                  {(authorityCounts['National Board of Revenue (NBR)'] || 0) +
                    (authorityCounts['Bangladesh Bank'] || 0)}
                </span>
                <span className="text-[11px] font-semibold text-blue-200">Fiscal &amp; FX</span>
              </div>
            </div>

            <div className="bg-blue-950/50 border border-blue-800/80 rounded-xl px-4 py-3">
              <span className="text-[11px] font-medium text-blue-200 block">
                Vetted Legal Drafts
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl sm:text-2xl font-black text-white font-mono tabular-nums">
                  {templatesList.length}
                </span>
                <span className="text-[11px] font-semibold text-amber-300">Instant PDF</span>
              </div>
            </div>

            <div className="bg-blue-950/50 border border-blue-800/80 rounded-xl px-4 py-3">
              <span className="text-[11px] font-medium text-blue-200 block">
                Saved in Your Session
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl sm:text-2xl font-black text-white font-mono tabular-nums">
                  {bookmarkedIds.length}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('regulatory');
                    setShowBookmarkedOnly((prev) => !prev);
                  }}
                  className="text-[11px] font-bold text-amber-300 hover:underline cursor-pointer"
                >
                  {showBookmarkedOnly ? 'Show All' : 'Filter Saved'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* ================= FEATURED 2026-2027 STATUTORY SPOTLIGHT ================= */}
        {activeTab === 'regulatory' && pinnedDocs.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0A2A66]" />
                <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#0A2A66]">
                  Key 2026–2027 Statutory &amp; Tax Reference Guides
                </h2>
              </div>
              <Link
                to="/SRO/TDS2026"
                className="text-xs font-bold text-[#1A5BB8] hover:text-[#0A2A66] inline-flex items-center gap-1"
              >
                <span>Open Full TDS Rules 2026 (SRO 273)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {pinnedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-[#1A5BB8] transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-[#0A2A66] border border-blue-200/60">
                        {doc.category} • {doc.year}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                        {doc.docDate}
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-extrabold text-[#0A2A66] leading-snug mb-1.5">
                      {doc.docNo}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                      {doc.description}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    {doc.internalUrl ? (
                      <Link
                        to={doc.internalUrl}
                        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#1A5BB8] hover:text-[#0A2A66] transition"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Interactive Guide</span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#1A5BB8] hover:text-[#0A2A66] cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Summary</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1.5">
                      {doc.pdfUrl && (
                        <a
                          href={doc.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold inline-flex items-center gap-1 transition"
                          title="Download Official PDF"
                        >
                          <Download className="w-3 h-3" />
                          <span>PDF</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition cursor-pointer"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ================= TOP CONTROLS BAR ================= */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 mb-6 space-y-3 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left Time Filter Buttons & Date Input */}
            <div className="flex flex-wrap items-center gap-2">
              {(['All', 'This Month', 'Last 6 Months', 'Last Year'] as TimeFilterOption[]).map(
                (tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTimeFilter(tf)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      timeFilter === tf
                        ? 'bg-[#0A2A66] text-white border-[#0A2A66]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {tf}
                  </button>
                )
              )}

              {/* Date Picker */}
              <div className="relative">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-mono tabular-nums focus:outline-none focus:border-[#1A5BB8]"
                  aria-label="Filter by exact issue date"
                />
              </div>

              {/* Saved Bookmarks Toggle */}
              {activeTab === 'regulatory' && (
                <button
                  type="button"
                  onClick={() => setShowBookmarkedOnly((prev) => !prev)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer tabular-nums ${
                    showBookmarkedOnly
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Saved ({bookmarkedIds.length})</span>
                </button>
              )}
            </div>

            {/* Right Sort & Search Box */}
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              {activeTab === 'regulatory' && (
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                    aria-label="Sort regulatory documents"
                  >
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="authority">Authority (A–Z)</option>
                    <option value="docNo">Document No.</option>
                  </select>
                </div>
              )}

              <div className="relative flex-1 sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={
                    activeTab === 'regulatory'
                      ? 'Search SRO 273, FEPD circular, authority, or keyword...'
                      : 'Search legal contracts, RJSC forms, HR templates...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:bg-white focus:border-[#1A5BB8] focus:ring-2 focus:ring-[#1A5BB8]/15 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Document Type Category Filter Strip */}
          {activeTab === 'regulatory' && (
            <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                  Instrument Type:
                </span>
                {REGULATORY_CATEGORIES.map((cat) => {
                  const isSelected = selectedDocCategory === cat;
                  const count = docCategoryCounts[cat] || 0;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedDocCategory(cat)}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer tabular-nums ${
                        isSelected
                          ? 'bg-[#1A5BB8] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset {activeFilterCount} Active Filter{activeFilterCount > 1 ? 's' : ''}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ================= MAIN 2-COLUMN LAYOUT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-6 items-start">
          {/* LEFT SIDEBAR: FILTER */}
          <aside className="space-y-4 lg:sticky lg:top-6">
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              {/* Filter Header */}
              <div className="bg-[#0A2A66] text-white px-4 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-blue-300" />
                  <h3 className="text-sm font-bold tracking-wide text-white">Filter Archive</h3>
                </div>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="bg-white/15 hover:bg-white/25 text-white px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              {/* Filter By Authority */}
              <div className="p-4 border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setAuthorityExpanded(!authorityExpanded)}
                  className="w-full flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-3 cursor-pointer"
                >
                  <span>Filter By Authority</span>
                  {authorityExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {authorityExpanded && (
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('regulatory');
                        setSelectedAuthority('All');
                      }}
                      className={`w-full flex items-center justify-between py-2 px-2.5 rounded-lg text-xs transition cursor-pointer ${
                        selectedAuthority === 'All'
                          ? 'bg-[#0A2A66] text-white font-bold'
                          : 'text-slate-700 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <span>All Authorities</span>
                      <span
                        className={`text-xs font-mono tabular-nums ${
                          selectedAuthority === 'All' ? 'text-blue-200' : 'text-slate-400'
                        }`}
                      >
                        ({docsList.length})
                      </span>
                    </button>

                    {authoritiesList.map((auth) => {
                      const count = authorityCounts[auth.name] || 0;
                      const isSelected = selectedAuthority === auth.name;

                      return (
                        <button
                          key={auth.code}
                          type="button"
                          onClick={() => {
                            setActiveTab('regulatory');
                            setSelectedAuthority(isSelected ? 'All' : auth.name);
                          }}
                          className={`w-full flex items-center justify-between py-2 px-2.5 rounded-lg text-xs transition cursor-pointer text-left ${
                            isSelected
                              ? 'bg-[#0A2A66] text-white font-bold'
                              : 'text-slate-700 hover:bg-slate-100 font-medium'
                          }`}
                        >
                          <span className="truncate pr-2">{auth.shortName}</span>
                          <span
                            className={`text-xs font-mono tabular-nums shrink-0 ${
                              isSelected ? 'text-blue-200' : 'text-slate-400'
                            }`}
                          >
                            ({count})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Filter By Year */}
              <div className="p-4 border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setYearExpanded(!yearExpanded)}
                  className="w-full flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-3 cursor-pointer"
                >
                  <span>Filter By Gazette Year</span>
                  {yearExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {yearExpanded && (
                  <div className="grid grid-cols-3 gap-1.5">
                    {yearsList.map((yr) => {
                      const isSelected = selectedYear === yr;
                      const count = yearCounts[yr] || 0;

                      return (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => {
                            setActiveTab('regulatory');
                            setSelectedYear(isSelected ? null : yr);
                          }}
                          className={`py-2 px-2 rounded-lg border text-xs font-bold transition cursor-pointer text-center tabular-nums ${
                            isSelected
                              ? 'bg-[#0A2A66] text-white border-[#0A2A66] shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className="block">{yr}</span>
                          <span
                            className={`text-[10px] font-mono block ${
                              isSelected ? 'text-blue-200' : 'text-slate-400'
                            }`}
                          >
                            {count} {count === 1 ? 'doc' : 'docs'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Template Categories (when on Templates Tab) */}
              <div className="p-4 bg-slate-50/70">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 block mb-2.5">
                  Legal Draft Categories
                </span>
                <div className="space-y-1">
                  {TEMPLATE_CATEGORIES.map((category) => {
                    const isSelected =
                      activeTab === 'templates' && selectedTemplateCategory === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => {
                          setActiveTab('templates');
                          setSelectedTemplateCategory(category);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#1A5BB8] text-white font-bold'
                            : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                        }`}
                      >
                        <span>{category}</span>
                        <ArrowRight className="w-3 h-3 opacity-60" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Companion Statutory Calculators Card */}
            <div className="border border-slate-200 rounded-xl bg-white p-4 shadow-2xs space-y-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0A2A66] block">
                Companion Tax &amp; Legal Tools
              </span>
              <Link
                to="/SRO/TDS2026"
                className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/60 text-xs font-bold text-[#0A2A66] transition"
              >
                <span>উৎসে কর বিধিমালা ২০২৬ (SRO 273)</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#1A5BB8] shrink-0" />
              </Link>
              <Link
                to="/tax-calculator"
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-800 transition"
              >
                <span>Income Tax Calculator (AY 2026-27)</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </Link>
              <Link
                to="/deferred-tax-calculator"
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-800 transition"
              >
                <span>IAS 12 Deferred Tax Engine</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </Link>
            </div>
          </aside>

          {/* RIGHT DATA AREA */}
          <main className="min-w-0">
            {activeTab === 'regulatory' ? (
              /* ================= REGULATORY DOCUMENTS TABLE ================= */
              <div className="space-y-3">
                {/* Active Filter Status Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <p className="text-xs font-semibold text-slate-600 tabular-nums">
                    Showing <strong className="text-slate-900">{filteredRegulatoryDocs.length}</strong> of{' '}
                    <strong className="text-slate-900">{docsList.length}</strong> statutory instruments
                    {selectedAuthority !== 'All' && (
                      <span>
                        {' '}
                        • Authority: <strong className="text-[#0A2A66]">{selectedAuthority}</strong>
                      </span>
                    )}
                    {selectedYear !== null && (
                      <span>
                        {' '}
                        • Year: <strong className="text-[#0A2A66]">{selectedYear}</strong>
                      </span>
                    )}
                  </p>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                  <table className="w-full text-left border-collapse min-w-[820px]">
                    <thead className="bg-[#0A2A66] text-white border-b border-blue-900">
                      <tr>
                        <th className="py-3.5 px-4 text-xs font-extrabold text-white tracking-wider w-[20%]">
                          Authority
                        </th>
                        <th className="py-3.5 px-4 text-xs font-extrabold text-white tracking-wider w-[24%]">
                          Document No.
                        </th>
                        <th className="py-3.5 px-4 text-xs font-extrabold text-white tracking-wider w-[13%]">
                          Document Date
                        </th>
                        <th className="py-3.5 px-4 text-xs font-extrabold text-white tracking-wider w-[31%]">
                          Description
                        </th>
                        <th className="py-3.5 px-4 text-xs font-extrabold text-white tracking-wider text-right w-[12%]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                      {filteredRegulatoryDocs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-14 text-center text-slate-500">
                            <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="font-bold text-slate-800 text-base">
                              No regulatory documents match your current filters
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Try clearing the selected year, authority, or search keyword.
                            </p>
                            <button
                              type="button"
                              onClick={handleClearFilters}
                              className="mt-4 px-4 py-2 bg-[#0A2A66] text-white rounded-lg text-xs font-bold hover:bg-[#1A5BB8] transition cursor-pointer"
                            >
                              Reset All Filters
                            </button>
                          </td>
                        </tr>
                      ) : (
                        filteredRegulatoryDocs.map((doc) => {
                          const isBookmarked = bookmarkedIds.includes(doc.id);
                          const isCopied = copiedId === doc.id;

                          return (
                            <tr
                              key={doc.id}
                              className={`hover:bg-blue-50/40 transition-colors ${
                                doc.isPinned ? 'bg-amber-50/20' : ''
                              }`}
                            >
                              {/* Column 1: Authority */}
                              <td className="py-3.5 px-4 align-top">
                                <span className="font-bold text-slate-900 block leading-snug">
                                  {doc.authority}
                                </span>
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                  <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/80">
                                    {doc.category}
                                  </span>
                                  {doc.isPinned && (
                                    <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                                      Featured
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Column 2: Document No */}
                              <td className="py-3.5 px-4 align-top">
                                {doc.internalUrl ? (
                                  <Link
                                    to={doc.internalUrl}
                                    className="text-[#1A5BB8] hover:text-[#0A2A66] hover:underline font-extrabold inline-flex items-start gap-1.5 leading-snug"
                                  >
                                    <span>{doc.docNo}</span>
                                    <BookOpen className="w-3.5 h-3.5 text-[#1A5BB8] shrink-0 mt-0.5" />
                                  </Link>
                                ) : doc.pdfUrl ? (
                                  <a
                                    href={doc.pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#1A5BB8] hover:text-[#0A2A66] hover:underline font-bold inline-flex items-start gap-1.5 leading-snug"
                                  >
                                    <span>{doc.docNo}</span>
                                    <Download className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  </a>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewDoc(doc)}
                                    className="text-[#1A5BB8] hover:text-[#0A2A66] hover:underline font-bold text-left cursor-pointer leading-snug"
                                  >
                                    {doc.docNo}
                                  </button>
                                )}
                              </td>

                              {/* Column 3: Document Date */}
                              <td className="py-3.5 px-4 text-slate-600 font-mono text-xs tabular-nums align-top whitespace-nowrap">
                                {doc.docDate}
                              </td>

                              {/* Column 4: Description */}
                              <td className="py-3.5 px-4 text-slate-700 leading-relaxed align-top">
                                <p className="text-slate-800 font-medium">{doc.description}</p>
                                {doc.highlights && doc.highlights.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {doc.highlights.map((hl) => (
                                      <span
                                        key={hl}
                                        className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-50 text-[#0A2A66] border border-blue-200/60"
                                      >
                                        {hl}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>

                              {/* Column 5: Actions */}
                              <td className="py-3.5 px-4 align-top text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {doc.internalUrl && (
                                    <Link
                                      to={doc.internalUrl}
                                      className="px-2.5 py-1 rounded-lg bg-[#0A2A66] hover:bg-[#1A5BB8] text-white text-[11px] font-bold transition whitespace-nowrap"
                                      title="Open Full Interactive Guide"
                                    >
                                      Read Guide
                                    </Link>
                                  )}

                                  {doc.pdfUrl && (
                                    <a
                                      href={doc.pdfUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                                      title="Download Official Gazette PDF"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </a>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => setPreviewDoc(doc)}
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                                    title="View Statutory Summary & Details"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleCopyCitation(doc)}
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                                    title="Copy Statutory Citation"
                                  >
                                    {isCopied ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => toggleBookmark(doc.id)}
                                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                      isBookmarked
                                        ? 'bg-amber-100 border-amber-300 text-amber-700'
                                        : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700'
                                    }`}
                                    title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Instrument'}
                                  >
                                    <Bookmark className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* ================= LEGAL TEMPLATES VIEW ================= */
              <div className="space-y-4">
                {/* Category Filter Pills for Templates */}
                <div className="flex flex-wrap items-center gap-2 pb-1">
                  {TEMPLATE_CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedTemplateCategory(category)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                        selectedTemplateCategory === category
                          ? 'bg-[#0A2A66] text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {/* Templates Cards Grid */}
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-6">
                    <p className="text-sm font-bold text-slate-700 mb-1">
                      No matching legal templates found
                    </p>
                    <p className="text-xs text-slate-500 mb-4">
                      Try clearing your search filter or switching template categories.
                    </p>
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="px-4 py-2 bg-[#0A2A66] text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTemplates.map((template) => {
                      const isCopied = copiedId === template.id;
                      const isDownloading = downloadingId === template.id;

                      return (
                        <div
                          key={template.id}
                          className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-[#1A5BB8] transition flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded bg-slate-100 text-slate-800">
                                {template.category}
                              </span>
                              {template.badge && (
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-blue-50 text-[#1A5BB8] border border-blue-200">
                                  {template.badge}
                                </span>
                              )}
                            </div>

                            <h3 className="text-base font-extrabold text-slate-900 mb-1">
                              {template.title}
                            </h3>
                            <p className="text-xs font-semibold text-[#1A5BB8] mb-2.5">
                              {template.subtitle}
                            </p>
                            <p className="text-xs text-slate-600 leading-relaxed mb-4">
                              {template.description}
                            </p>

                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 mb-4 flex items-center gap-2 text-[11px] text-slate-700">
                              <Scale className="w-3.5 h-3.5 text-[#0A2A66] shrink-0" />
                              <span className="truncate">
                                <strong className="text-slate-900">Law:</strong>{' '}
                                {template.governingLaw}
                              </span>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                            <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                              {template.fileSizeEstimate}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setPreviewTemplate(template)}
                                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview Clauses</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCopyText(template)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Copy Full Contract Text"
                              >
                                {isCopied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDownloadTemplate(template)}
                                disabled={isDownloading}
                                className="px-3.5 py-1.5 rounded-lg bg-[#0A2A66] hover:bg-[#1A5BB8] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>{isDownloading ? 'Generating...' : 'PDF'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ================= MODAL 1: REGULATORY DOCUMENT SUMMARY PREVIEW ================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded bg-blue-100 text-[#0A2A66]">
                    {previewDoc.authority}
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {previewDoc.category}
                  </span>
                  <span className="text-xs font-mono text-slate-500 tabular-nums">
                    Issued: {previewDoc.docDate}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">{previewDoc.docNo}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Subject / Title
                </span>
                <p className="font-bold text-slate-900 text-sm sm:text-base">
                  {previewDoc.description}
                </p>
              </div>

              {previewDoc.details && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A2A66] block mb-1">
                    Statutory Scope &amp; Operational Summary
                  </span>
                  {previewDoc.details}
                </div>
              )}

              {previewDoc.highlights && previewDoc.highlights.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Key Compliance Highlights
                  </span>
                  <ul className="space-y-1">
                    {previewDoc.highlights.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-slate-700">
                        <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleCopyCitation(previewDoc)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Citation</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {previewDoc.internalUrl && (
                  <Link
                    to={previewDoc.internalUrl}
                    onClick={() => setPreviewDoc(null)}
                    className="px-4 py-2 rounded-lg bg-[#0A2A66] hover:bg-[#1A5BB8] text-white text-xs font-bold inline-flex items-center gap-1.5 transition"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Open Full Interactive Guide</span>
                  </Link>
                )}

                {previewDoc.pdfUrl && (
                  <a
                    href={previewDoc.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Official PDF</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: LEGAL TEMPLATE CLAUSE PREVIEW ================= */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 shrink-0">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded bg-blue-100 text-[#0A2A66]">
                    {previewTemplate.category}
                  </span>
                  {previewTemplate.badge && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {previewTemplate.badge}
                    </span>
                  )}
                  <span className="text-xs font-mono text-slate-500">
                    {previewTemplate.fileSizeEstimate}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  {previewTemplate.title}
                </h3>
                <p className="text-xs font-semibold text-[#1A5BB8] mt-0.5">
                  {previewTemplate.subtitle} • Governing Law: {previewTemplate.governingLaw}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {previewTemplate.description}
              </p>

              {previewTemplate.sections && previewTemplate.sections.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0A2A66]">
                    Structured Statutory Clauses
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    {previewTemplate.sections.map((sec) => (
                      <div
                        key={sec.heading}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200"
                      >
                        <h5 className="text-xs font-bold text-slate-900 mb-1">{sec.heading}</h5>
                        <p className="text-xs text-slate-600 leading-relaxed">{sec.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0A2A66] mb-2">
                  Complete Draft Instrument Text
                </h4>
                <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto border border-slate-800">
                  {previewTemplate.fullText}
                </pre>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleCopyText(previewTemplate)}
                className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Full Clauses</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate(previewTemplate)}
                  className="px-4 py-2 rounded-lg bg-[#0A2A66] hover:bg-[#1A5BB8] text-white text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Formatted PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResourceLibraryPage;
