import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Check, 
  X, 
  Download, 
  RefreshCw, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  Sparkles, 
  ArrowLeft,
  Eye,
  AlertTriangle,
  FileCode,
  ExternalLink,
  Layers,
  Clock,
  Filter
} from 'lucide-react';
import { RegulatoryDocument } from '../../data/regulatoryLibraryData';
import { ResourceTemplate } from '../../data/resourceTemplates';
import { 
  getRegulatoryDocuments, 
  saveRegulatoryDocument, 
  deleteRegulatoryDocument, 
  getResourceTemplates, 
  saveResourceTemplate, 
  deleteResourceTemplate, 
  resetRegulatoryLibraryDefaults 
} from '../../services/regulatoryLibraryService';

export function AdminRegulatoryLibraryPage() {
  const [activeTab, setActiveTab] = useState<'docs' | 'templates'>('docs');

  // Datasets State
  const [docs, setDocs] = useState<RegulatoryDocument[]>([]);
  const [templates, setTemplates] = useState<ResourceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Search & Filter State
  const [docSearch, setDocSearch] = useState('');
  const [docAuthorityFilter, setDocAuthorityFilter] = useState('All');
  const [templateSearch, setTemplateSearch] = useState('');

  // Modals State
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Partial<RegulatoryDocument> | null>(null);

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<ResourceTemplate> | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<{ id: string; type: 'doc' | 'template'; name: string } | null>(null);

  // Initial Load
  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedDocs, fetchedTemplates] = await Promise.all([
        getRegulatoryDocuments(),
        getResourceTemplates(),
      ]);
      setDocs(fetchedDocs);
      setTemplates(fetchedTemplates);
    } catch (err) {
      console.error('Error loading library data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // --- Doc Form Handlers ---
  const handleOpenDocModal = (doc?: RegulatoryDocument) => {
    if (doc) {
      setEditingDoc({ ...doc });
    } else {
      setEditingDoc({
        authority: 'Bangladesh Bank',
        docNo: '',
        docDate: new Date().toISOString().split('T')[0],
        category: 'Circular',
        description: '',
        pdfUrl: '',
        details: '',
      });
    }
    setDocModalOpen(true);
  };

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc || !editingDoc.authority || !editingDoc.docNo || !editingDoc.docDate || !editingDoc.description) {
      alert('Please fill in all required fields (Authority, Doc No, Date, Description).');
      return;
    }

    try {
      const saved = await saveRegulatoryDocument(editingDoc as any);
      showToast(`Successfully saved document "${saved.docNo}"!`);
      setDocModalOpen(false);
      setEditingDoc(null);
      await loadData();
    } catch (err: any) {
      alert(`Error saving document: ${err?.message || 'Unknown error'}`);
    }
  };

  // --- Template Form Handlers ---
  const handleOpenTemplateModal = (tpl?: ResourceTemplate) => {
    if (tpl) {
      setEditingTemplate({ ...tpl });
    } else {
      setEditingTemplate({
        title: '',
        subtitle: '',
        category: 'Legal Contracts',
        description: '',
        fileSizeEstimate: '2 Pages • PDF',
        pages: 2,
        badge: 'AY 2026-27 Compliant',
        tags: ['Contract Act 1872', 'Compliance'],
        governingLaw: 'Contract Act, 1872 (Bangladesh)',
        fullText: '',
      });
    }
    setTemplateModalOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate || !editingTemplate.title || !editingTemplate.category || !editingTemplate.description || !editingTemplate.fullText) {
      alert('Please fill in Title, Category, Description, and Clause Full Text.');
      return;
    }

    try {
      const saved = await saveResourceTemplate(editingTemplate as any);
      showToast(`Successfully saved template "${saved.title}"!`);
      setTemplateModalOpen(false);
      setEditingTemplate(null);
      await loadData();
    } catch (err: any) {
      alert(`Error saving template: ${err?.message || 'Unknown error'}`);
    }
  };

  // --- Delete Handler ---
  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      if (deleteConfirmId.type === 'doc') {
        await deleteRegulatoryDocument(deleteConfirmId.id);
        showToast(`Deleted document "${deleteConfirmId.name}"`);
      } else {
        await deleteResourceTemplate(deleteConfirmId.id);
        showToast(`Deleted template "${deleteConfirmId.name}"`);
      }
      setDeleteConfirmId(null);
      await loadData();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleResetDefaults = async () => {
    if (confirm('Are you sure you want to reset all regulatory documents and templates to official statutory defaults? Custom entries will be replaced.')) {
      await resetRegulatoryLibraryDefaults();
      showToast('Regulatory library reset to statutory defaults.');
      await loadData();
    }
  };

  // Filtered Lists
  const filteredDocs = docs.filter((d) => {
    const matchesAuth = docAuthorityFilter === 'All' || d.authority.includes(docAuthorityFilter);
    const q = docSearch.toLowerCase().trim();
    const matchesQuery =
      q === '' ||
      d.authority.toLowerCase().includes(q) ||
      d.docNo.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q);

    return matchesAuth && matchesQuery;
  });

  const filteredTemplates = templates.filter((t) => {
    const q = templateSearch.toLowerCase().trim();
    return (
      q === '' ||
      t.title.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-20 font-sans">
      {/* Toast Notification */}
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold">{statusMessage}</span>
        </div>
      )}

      {/* Admin Header */}
      <div className="bg-[#0A2A66] text-white pt-8 pb-12 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-blue-900/60">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link
                  to="/resource-library"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-blue-200 hover:text-white text-xs font-semibold transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>View Public Resource Library</span>
                </Link>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30">
                  Admin Control Desk
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Regulatory Library Management
              </h1>
              <p className="text-xs sm:text-sm text-blue-200/90 mt-1 max-w-2xl leading-relaxed">
                Publish, update, and manage official regulatory notifications, central bank circulars, NBR SROs, RJSC eBRS notifications, and statutory legal draft templates.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Reset library back to original defaults"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>

              {activeTab === 'docs' ? (
                <button
                  type="button"
                  onClick={() => handleOpenDocModal()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Circular / SRO</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenTemplateModal()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Legal Template</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/10 text-white">
              <span className="text-xs text-blue-200 font-medium block">Total Regulatory Docs</span>
              <span className="text-2xl font-black font-mono mt-0.5 block">{docs.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/10 text-white">
              <span className="text-xs text-blue-200 font-medium block">Downloadable Templates</span>
              <span className="text-2xl font-black font-mono mt-0.5 block">{templates.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/10 text-white">
              <span className="text-xs text-blue-200 font-medium block">Active Authorities</span>
              <span className="text-2xl font-black font-mono mt-0.5 block">6 Authorities</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/10 text-white">
              <span className="text-xs text-blue-200 font-medium block">AY Scope</span>
              <span className="text-2xl font-black text-emerald-300 mt-0.5 block">AY 2026-2027</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
          
          {/* Section Navigation Tabs */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('docs')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                  activeTab === 'docs'
                    ? 'bg-[#0A2A66] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                Circulars &amp; SROs ({docs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('templates')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                  activeTab === 'templates'
                    ? 'bg-[#0A2A66] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                Draft Legal Templates ({templates.length})
              </button>
            </div>

            <span className="text-xs font-mono text-slate-500 hidden sm:inline">
              Persisted in Live LocalStorage/Firestore
            </span>
          </div>

          <div className="p-6">
            {activeTab === 'docs' ? (
              /* Regulatory Docs Management Table */
              <div className="space-y-4">
                {/* Search & Filter Toolbar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search circulars by doc no, authority, description..."
                      value={docSearch}
                      onChange={(e) => setDocSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    {docSearch && (
                      <button onClick={() => setDocSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs font-bold text-slate-600">Authority:</span>
                    <select
                      value={docAuthorityFilter}
                      onChange={(e) => setDocAuthorityFilter(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="All">All Authorities</option>
                      <option value="Bangladesh Bank">Bangladesh Bank</option>
                      <option value="National Board of Revenue">NBR</option>
                      <option value="BIDA">BIDA</option>
                      <option value="RJSC">RJSC</option>
                      <option value="BSEC">BSEC</option>
                      <option value="Ministry of Law">Ministry of Law</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-[#0A2A66] text-white text-xs font-bold border-b border-blue-900">
                      <tr>
                        <th className="p-3.5 text-white font-extrabold tracking-wider w-[20%]">Authority</th>
                        <th className="p-3.5 text-white font-extrabold tracking-wider w-[25%]">Document No.</th>
                        <th className="p-3.5 text-white font-extrabold tracking-wider w-[15%]">Issue Date</th>
                        <th className="p-3.5 text-white font-extrabold tracking-wider w-[30%]">Description</th>
                        <th className="p-3.5 text-right text-white font-extrabold tracking-wider w-[10%]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                      {filteredDocs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                            No circulars or SRO documents match your search filter.
                          </td>
                        </tr>
                      ) : (
                        filteredDocs.map((doc) => (
                          <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3.5 font-bold text-slate-900 align-top">
                              {doc.authority}
                            </td>
                            <td className="p-3.5 align-top">
                              <span className="font-bold text-[#1A5BB8] block">{doc.docNo}</span>
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                {doc.category}
                              </span>
                            </td>
                            <td className="p-3.5 font-mono text-xs text-slate-600 align-top">
                              {doc.docDate}
                            </td>
                            <td className="p-3.5 text-slate-700 align-top leading-relaxed">
                              {doc.description}
                              {doc.pdfUrl && (
                                <a
                                  href={doc.pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline mt-1 block"
                                >
                                  <Download className="w-3 h-3" /> PDF Attached
                                </a>
                              )}
                            </td>
                            <td className="p-3.5 text-right align-top">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenDocModal(doc)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-900 transition cursor-pointer"
                                  title="Edit Document"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId({ id: doc.id, type: 'doc', name: doc.docNo })}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                                  title="Delete Document"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Draft Legal Templates Management Table */
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search legal templates by title or category..."
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTemplates.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-[#0A2A66]">
                            {tpl.category}
                          </span>
                          {tpl.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {tpl.badge}
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-bold text-slate-900 mb-1">
                          {tpl.title}
                        </h4>
                        <p className="text-xs text-[#1A5BB8] font-semibold mb-2">
                          {tpl.subtitle}
                        </p>
                        <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                          {tpl.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono text-slate-500">
                          {tpl.governingLaw.split('&')[0]}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenTemplateModal(tpl)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId({ id: tpl.id, type: 'template', name: tpl.title })}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Doc Modal (Add / Edit) */}
      {docModalOpen && editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-black text-slate-900">
                {editingDoc.id ? 'Edit Regulatory Document' : 'Add New Regulatory Document'}
              </h3>
              <button
                type="button"
                onClick={() => setDocModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDoc} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Authority *</label>
                <select
                  value={editingDoc.authority || 'Bangladesh Bank'}
                  onChange={(e) => setEditingDoc({ ...editingDoc, authority: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Bangladesh Bank">Bangladesh Bank</option>
                  <option value="National Board of Revenue (NBR)">National Board of Revenue (NBR)</option>
                  <option value="BIDA">BIDA</option>
                  <option value="RJSC">RJSC</option>
                  <option value="BSEC">BSEC</option>
                  <option value="Ministry of Law, Justice and Parliamentary Affairs">Ministry of Law</option>
                  <option value="Other">Other Authority</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Document Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FEPD-2 Circular No. 11"
                    value={editingDoc.docNo || ''}
                    onChange={(e) => setEditingDoc({ ...editingDoc, docNo: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Issue Date *</label>
                  <input
                    type="date"
                    required
                    value={editingDoc.docDate || ''}
                    onChange={(e) => setEditingDoc({ ...editingDoc, docDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={editingDoc.category || 'Circular'}
                  onChange={(e) => setEditingDoc({ ...editingDoc, category: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Circular">Circular</option>
                  <option value="SRO">SRO</option>
                  <option value="Ordinance">Ordinance</option>
                  <option value="Office Order">Office Order</option>
                  <option value="Notification">Notification</option>
                  <option value="Guideline">Guideline</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Title *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Short description of the notification..."
                  value={editingDoc.description || ''}
                  onChange={(e) => setEditingDoc({ ...editingDoc, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official PDF Download URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://pub-....r2.dev/official-document.pdf"
                  value={editingDoc.pdfUrl || ''}
                  onChange={(e) => setEditingDoc({ ...editingDoc, pdfUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Internal Guide Route (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. /SRO/TDS2026"
                    value={editingDoc.internalUrl || ''}
                    onChange={(e) => setEditingDoc({ ...editingDoc, internalUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(editingDoc.isPinned)}
                      onChange={(e) => setEditingDoc({ ...editingDoc, isPinned: e.target.checked })}
                      className="rounded border-slate-300 text-[#0A2A66] focus:ring-blue-600"
                    />
                    <span>Feature in Top Spotlight Bar</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Statutory Notes (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Detailed summary of statutory requirements, section references..."
                  value={editingDoc.details || ''}
                  onChange={(e) => setEditingDoc({ ...editingDoc, details: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDocModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0A2A66] hover:bg-[#1A5BB8] text-white text-xs font-black shadow-md cursor-pointer"
                >
                  Save Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Modal (Add / Edit) */}
      {templateModalOpen && editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-black text-slate-900">
                {editingTemplate.id ? 'Edit Legal Template' : 'Add New Legal Template'}
              </h3>
              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Template Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shareholders Agreement (SHA)"
                    value={editingTemplate.title || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={editingTemplate.category || 'Legal Contracts'}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Legal Contracts">Legal Contracts</option>
                    <option value="Tax & Compliance">Tax & Compliance</option>
                    <option value="Corporate & RJSC">Corporate & RJSC</option>
                    <option value="Employment & HR">Employment & HR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle / Tagline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bilateral Equity & Board Voting Rights Agreement"
                  value={editingTemplate.subtitle || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subtitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Governing Law</label>
                <input
                  type="text"
                  placeholder="e.g. Companies Act, 1994 & Contract Act, 1872"
                  value={editingTemplate.governingLaw || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, governingLaw: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Brief summary of template purpose and statutory protection..."
                  value={editingTemplate.description || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Document Clause Text *</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Paste complete contract clauses..."
                  value={editingTemplate.fullText || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, fullText: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTemplateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0A2A66] hover:bg-[#1A5BB8] text-white text-xs font-black shadow-md cursor-pointer"
                >
                  Save Legal Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black">Confirm Delete Action</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-900">&quot;{deleteConfirmId.name}&quot;</strong>? This action will remove it from the live Regulatory Library.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold transition shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminRegulatoryLibraryPage;
