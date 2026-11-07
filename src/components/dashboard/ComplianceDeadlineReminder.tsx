import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, 
  BellRing, 
  Calendar as CalendarIcon, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  ExternalLink, 
  Check, 
  Filter, 
  Sparkles, 
  ShieldAlert, 
  CalendarCheck, 
  AlertCircle,
  ChevronRight,
  Share2,
  RefreshCw,
  Tag,
  FileSpreadsheet
} from 'lucide-react';
import { exportDashboardDataAsCSV } from '../../utils/dashboardCsvExporter';

export interface ComplianceDeadline {
  id: string;
  title: string;
  category: 'Income Tax' | 'VAT & Customs' | 'RJSC Corporate' | 'Trade License' | 'Audit & Accounts' | 'Custom';
  entityName?: string;
  dueDate: string; // YYYY-MM-DD
  leadDaysAlert: number; // Days before due date to start notifying (default: 7)
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
}

const STORAGE_KEY_REMINDERS = 'accounticca_compliance_deadline_reminders_v1';

const DEFAULT_DEADLINES: ComplianceDeadline[] = [
  {
    id: 'dl-vat-mushak-nov',
    title: 'Monthly VAT Return (Mushak 9.1 Filing & Payment)',
    category: 'VAT & Customs',
    entityName: 'E-Lawyers Consulting Ltd',
    dueDate: '2026-11-15',
    leadDaysAlert: 7,
    priority: 'high',
    notes: 'Must submit withholding VAT certificates and Mushak 6.3 invoices.',
    isCompleted: false,
    createdAt: '2026-10-01T08:00:00Z'
  },
  {
    id: 'dl-indiv-tax-nov',
    title: 'Individual Tax Return Filing Deadline (Tax Day)',
    category: 'Income Tax',
    entityName: 'All Individual Assessment Partners',
    dueDate: '2026-11-30',
    leadDaysAlert: 14,
    priority: 'high',
    notes: 'Section 166 of Income Tax Act 2023 deadline for FY 2025-26 assessment year 2026-27.',
    isCompleted: false,
    createdAt: '2026-10-01T08:00:00Z'
  },
  {
    id: 'dl-ait-q2-dec',
    title: 'Advance Income Tax (AIT) Q2 Installment Payment',
    category: 'Income Tax',
    entityName: 'Corporate Advisory Clients',
    dueDate: '2026-12-15',
    leadDaysAlert: 7,
    priority: 'medium',
    notes: 'Pay 2nd installment of estimated corporate tax in Bangladesh Bank treasury.',
    isCompleted: false,
    createdAt: '2026-10-01T08:00:00Z'
  },
  {
    id: 'dl-rjsc-form-ix',
    title: 'Annual RJSC Form IX & XXIII Filing',
    category: 'RJSC Corporate',
    entityName: 'Private Limited Companies',
    dueDate: '2026-12-30',
    leadDaysAlert: 10,
    priority: 'medium',
    notes: 'Submit annual return of directors and balance sheet following AGM.',
    isCompleted: false,
    createdAt: '2026-10-01T08:00:00Z'
  }
];

// Helper to calculate days remaining
export const calculateDaysRemaining = (dueDateStr: string, referenceDateStr?: string): number => {
  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
  refDate.setHours(0, 0, 0, 0);

  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - refDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const ComplianceDeadlineReminder: React.FC = () => {
  const [deadlines, setDeadlines] = useState<ComplianceDeadline[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REMINDERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse compliance deadlines', e);
    }
    return DEFAULT_DEADLINES;
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'approaching' | 'overdue' | 'completed'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Form inputs
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ComplianceDeadline['category']>('Income Tax');
  const [entityName, setEntityName] = useState('');
  const [dueDate, setDueDate] = useState('2026-11-15');
  const [leadDaysAlert, setLeadDaysAlert] = useState(7);
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [notes, setNotes] = useState('');

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(deadlines));
      window.dispatchEvent(new Event('accounticca_deadlines_updated'));
    } catch (e) {
      console.error('Failed to save compliance deadlines', e);
    }
  }, [deadlines]);

  // Handle Form Submit
  const handleSaveDeadline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    if (editingId) {
      setDeadlines(prev => prev.map(dl => {
        if (dl.id === editingId) {
          return {
            ...dl,
            title: title.trim(),
            category,
            entityName: entityName.trim() || undefined,
            dueDate,
            leadDaysAlert: Number(leadDaysAlert) || 7,
            priority,
            notes: notes.trim() || undefined
          };
        }
        return dl;
      }));
      setEditingId(null);
    } else {
      const newDl: ComplianceDeadline = {
        id: `dl-${Date.now()}`,
        title: title.trim(),
        category,
        entityName: entityName.trim() || undefined,
        dueDate,
        leadDaysAlert: Number(leadDaysAlert) || 7,
        priority,
        notes: notes.trim() || undefined,
        isCompleted: false,
        createdAt: new Date().toISOString()
      };
      setDeadlines(prev => [newDl, ...prev]);
    }

    // Reset Form
    setTitle('');
    setEntityName('');
    setNotes('');
    setShowAddForm(false);
  };

  // Start Edit
  const handleStartEdit = (dl: ComplianceDeadline) => {
    setEditingId(dl.id);
    setTitle(dl.title);
    setCategory(dl.category);
    setEntityName(dl.entityName || '');
    setDueDate(dl.dueDate);
    setLeadDaysAlert(dl.leadDaysAlert || 7);
    setPriority(dl.priority);
    setNotes(dl.notes || '');
    setShowAddForm(true);
  };

  // Toggle Completion
  const handleToggleComplete = (id: string) => {
    setDeadlines(prev => prev.map(dl => {
      if (dl.id === id) {
        const nextState = !dl.isCompleted;
        return {
          ...dl,
          isCompleted: nextState,
          completedAt: nextState ? new Date().toISOString() : undefined
        };
      }
      return dl;
    }));
  };

  // Delete Deadline
  const handleDelete = (id: string) => {
    if (window.confirm('Delete this compliance deadline reminder?')) {
      setDeadlines(prev => prev.filter(dl => dl.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setShowAddForm(false);
      }
    }
  };

  // Export to Google Calendar
  const handleSyncToGoogleCalendar = (dl: ComplianceDeadline) => {
    const calendarTitle = encodeURIComponent(`${dl.title} - Compliance Deadline`);
    const details = encodeURIComponent(`Compliance Deadline: ${dl.title}\nCategory: ${dl.category}\nEntity: ${dl.entityName || 'N/A'}\nNotes: ${dl.notes || 'None'}`);
    const location = encodeURIComponent(dl.entityName || 'NBR / RJSC Portal');

    const start = new Date(`${dl.dueDate}T09:00:00`);
    const end = new Date(`${dl.dueDate}T17:00:00`);

    const formatGCal = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
    const dates = `${formatGCal(start)}/${formatGCal(end)}`;

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calendarTitle}&dates=${dates}&details=${details}&location=${location}`;
    window.open(url, '_blank');
  };

  // Approaching & Overdue Analysis
  const processedDeadlines = useMemo(() => {
    return deadlines.map(dl => {
      const daysLeft = calculateDaysRemaining(dl.dueDate);
      const isOverdue = daysLeft < 0 && !dl.isCompleted;
      const isApproaching = daysLeft >= 0 && daysLeft <= dl.leadDaysAlert && !dl.isCompleted;
      return {
        ...dl,
        daysLeft,
        isOverdue,
        isApproaching
      };
    }).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [deadlines]);

  const urgentCount = useMemo(() => {
    return processedDeadlines.filter(dl => (dl.isApproaching || dl.isOverdue) && !dl.isCompleted).length;
  }, [processedDeadlines]);

  // Filtered List
  const filteredDeadlines = useMemo(() => {
    return processedDeadlines.filter(dl => {
      if (selectedCategory !== 'all' && dl.category !== selectedCategory) return false;

      if (filterTab === 'approaching') return dl.isApproaching || (dl.daysLeft >= 0 && dl.daysLeft <= 10 && !dl.isCompleted);
      if (filterTab === 'overdue') return dl.isOverdue;
      if (filterTab === 'completed') return dl.isCompleted;
      return true;
    });
  }, [processedDeadlines, filterTab, selectedCategory]);

  return (
    <div id="compliance-deadline-reminder-card" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs shrink-0">
            <BellRing className="w-6 h-6 text-amber-600 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">Compliance Deadline Reminder Hub</h2>
              {urgentCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  <span>{urgentCount} Approaching / Overdue</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Set statutory tax filing dates, RJSC return deadlines, and receive automated browser storage reminders.
            </p>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => {
              const el = document.getElementById('compliance-deadlines-calendar-component');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-all cursor-pointer border border-emerald-200 shadow-2xs"
            title="Jump to interactive timeline calendar view"
          >
            <CalendarIcon className="w-4 h-4 text-emerald-600" />
            <span>Calendar View</span>
          </button>

          <button
            onClick={() => exportDashboardDataAsCSV('deadlines')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all cursor-pointer border border-slate-200 shadow-2xs"
            title="Download stored compliance deadlines as CSV file"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setEditingId(null);
              setShowAddForm(!showAddForm);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Add Custom Reminder</span>
          </button>
        </div>
      </div>

      {/* Add / Edit Form Panel */}
      {showAddForm && (
        <form onSubmit={handleSaveDeadline} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              <span>{editingId ? 'Edit Compliance Deadline' : 'Set New Compliance Deadline Reminder'}</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-xs">
            <div className="sm:col-span-8 space-y-1">
              <label className="block font-bold text-slate-700 uppercase tracking-wider">
                Deadline Title / Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Monthly VAT Return (Mushak 9.1) or Income Tax Return"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-4 space-y-1">
              <label className="block font-bold text-slate-700 uppercase tracking-wider">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="Income Tax">Income Tax</option>
                <option value="VAT & Customs">VAT & Customs</option>
                <option value="RJSC Corporate">RJSC Corporate</option>
                <option value="Trade License">Trade License</option>
                <option value="Audit & Accounts">Audit & Accounts</option>
                <option value="Custom">Custom Regulatory</option>
              </select>
            </div>

            <div className="sm:col-span-4 space-y-1">
              <label className="block font-bold text-slate-700 uppercase tracking-wider">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-4 space-y-1">
              <label className="block font-bold text-slate-700 uppercase tracking-wider">
                Entity / Company Name
              </label>
              <input
                type="text"
                placeholder="e.g. ABC Trading Co. / Self"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-4 space-y-1">
              <label className="block font-bold text-slate-700 uppercase tracking-wider">
                Alert Days Before Due
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={leadDaysAlert}
                onChange={(e) => setLeadDaysAlert(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-12 space-y-1">
              <label className="block font-bold text-slate-700 uppercase tracking-wider">
                Filing Notes & Instructions
              </label>
              <input
                type="text"
                placeholder="e.g. Collect Mushak 6.3 certificates and treasury challans prior to submission"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
            >
              {editingId ? 'Update Reminder' : 'Save Deadline Reminder'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs & Category Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
        {/* Status Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 self-start sm:self-auto">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            All Deadlines ({processedDeadlines.length})
          </button>
          <button
            onClick={() => setFilterTab('approaching')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              filterTab === 'approaching' ? 'bg-amber-500 text-slate-950 shadow-xs font-black' : 'text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Approaching ({processedDeadlines.filter(d => d.isApproaching && !d.isCompleted).length})</span>
          </button>
          <button
            onClick={() => setFilterTab('overdue')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              filterTab === 'overdue' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Overdue ({processedDeadlines.filter(d => d.isOverdue).length})</span>
          </button>
          <button
            onClick={() => setFilterTab('completed')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterTab === 'completed' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Filed ({processedDeadlines.filter(d => d.isCompleted).length})
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="Income Tax">Income Tax</option>
            <option value="VAT & Customs">VAT & Customs</option>
            <option value="RJSC Corporate">RJSC Corporate</option>
            <option value="Trade License">Trade License</option>
            <option value="Audit & Accounts">Audit & Accounts</option>
          </select>
        </div>
      </div>

      {/* Deadlines List */}
      {filteredDeadlines.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
          <CalendarIcon className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs font-bold text-slate-600">No compliance reminders found for this filter</p>
          <p className="text-[11px] text-slate-400">Click "Add Custom Reminder" to track your entity's tax and filing dates.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDeadlines.map((dl) => {
            const isUrgent = dl.isApproaching || dl.isOverdue;

            return (
              <div
                key={dl.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  dl.isCompleted
                    ? 'bg-slate-50/80 border-slate-200 text-slate-500 opacity-80'
                    : dl.isOverdue
                    ? 'bg-rose-50/70 border-rose-200 text-slate-900 shadow-xs'
                    : dl.isApproaching
                    ? 'bg-amber-50/80 border-amber-300 text-slate-900 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(dl.id)}
                    className="mt-1 shrink-0 cursor-pointer"
                    title={dl.isCompleted ? 'Mark as Pending' : 'Mark as Filed / Completed'}
                  >
                    {dl.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        dl.isOverdue 
                          ? 'border-rose-500 hover:bg-rose-100' 
                          : dl.isApproaching 
                          ? 'border-amber-500 hover:bg-amber-100' 
                          : 'border-slate-300 hover:border-emerald-500'
                      }`} />
                    )}
                  </button>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${
                        dl.category === 'Income Tax'
                          ? 'bg-blue-100 text-blue-800'
                          : dl.category === 'VAT & Customs'
                          ? 'bg-emerald-100 text-emerald-800'
                          : dl.category === 'RJSC Corporate'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {dl.category}
                      </span>

                      {dl.entityName && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-white/80 border border-slate-200 px-2 py-0.5 rounded">
                          🏢 {dl.entityName}
                        </span>
                      )}

                      {/* Countdown Badge */}
                      {dl.isCompleted ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Filed on {new Date(dl.completedAt || Date.now()).toLocaleDateString()}
                        </span>
                      ) : dl.isOverdue ? (
                        <span className="text-[10px] font-black text-rose-800 bg-rose-200 border border-rose-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-rose-700" /> Overdue by {Math.abs(dl.daysLeft)} Days
                        </span>
                      ) : dl.isApproaching ? (
                        <span className="text-[10px] font-black text-slate-950 bg-amber-400 border border-amber-500 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                          <Clock className="w-3 h-3 text-slate-950" />
                          <span>{dl.daysLeft === 0 ? 'DUE TODAY!' : `Due in ${dl.daysLeft} Days`}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          Due in {dl.daysLeft} Days
                        </span>
                      )}
                    </div>

                    <h4 className={`text-sm font-extrabold ${
                      dl.isCompleted ? 'line-through text-slate-400 font-medium' : 'text-slate-900'
                    }`}>
                      {dl.title}
                    </h4>

                    {dl.notes && (
                      <p className="text-xs text-slate-500 italic leading-relaxed">
                        💡 {dl.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleSyncToGoogleCalendar(dl)}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    title="Add deadline to Google Calendar"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden md:inline">Calendar Sync</span>
                  </button>

                  <button
                    onClick={() => handleStartEdit(dl)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                    title="Edit deadline reminder"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(dl.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    title="Delete reminder"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Approaching Compliance Deadline Top Banner Toast component for the Dashboard
export const ApproachingComplianceToastBanner: React.FC<{ onDismiss?: () => void }> = ({ onDismiss }) => {
  const [deadlines, setDeadlines] = useState<ComplianceDeadline[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REMINDERS);
      if (stored) {
        setDeadlines(JSON.parse(stored));
      } else {
        setDeadlines(DEFAULT_DEADLINES);
      }
    } catch {}
  }, []);

  const urgentList = useMemo(() => {
    return deadlines
      .filter(dl => !dl.isCompleted)
      .map(dl => {
        const daysLeft = calculateDaysRemaining(dl.dueDate);
        const isOverdue = daysLeft < 0;
        const isApproaching = daysLeft >= 0 && daysLeft <= (dl.leadDaysAlert || 7);
        return { ...dl, daysLeft, isOverdue, isApproaching };
      })
      .filter(dl => dl.isOverdue || dl.isApproaching)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [deadlines]);

  if (dismissed || urgentList.length === 0) return null;

  const topUrgent = urgentList[0];

  return (
    <div id="approaching-compliance-deadline-toast" className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in border border-amber-400/30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
          <BellRing className="w-5 h-5 text-amber-100 animate-bounce" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest bg-black/30 text-amber-200 px-2 py-0.5 rounded-full">
              Approaching Statutory Deadline
            </span>
            <span className="text-xs font-bold text-amber-100">
              {topUrgent.isOverdue 
                ? `⚠️ Overdue by ${Math.abs(topUrgent.daysLeft)} days` 
                : topUrgent.daysLeft === 0 
                ? '⚡ DUE TODAY!' 
                : `⏰ Due in ${topUrgent.daysLeft} days (${new Date(topUrgent.dueDate).toLocaleDateString()})`}
            </span>
          </div>
          <p className="text-sm font-extrabold text-white mt-0.5">
            {topUrgent.title} {topUrgent.entityName ? `(${topUrgent.entityName})` : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <a
          href="#compliance-deadline-reminder-card"
          className="px-3 py-1.5 bg-white text-slate-900 hover:bg-amber-100 font-extrabold text-xs rounded-xl transition-colors shadow-xs"
        >
          View Deadlines ({urgentList.length})
        </a>
        <button
          onClick={() => {
            setDismissed(true);
            if (onDismiss) onDismiss();
          }}
          className="p-1.5 text-amber-100 hover:text-white rounded-lg"
          title="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ComplianceDeadlineReminder;
