import React, { useState, useEffect, useMemo } from 'react';
import {
  BellRing,
  Mail,
  Clock,
  AlertCircle,
  CheckCircle2,
  Send,
  Settings,
  Plus,
  Search,
  Filter,
  DollarSign,
  Building2,
  User,
  Calendar,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Eye,
  Check,
  Copy,
  Sliders,
  ChevronRight,
  Sparkles,
  Inbox
} from 'lucide-react';
import {
  PendingInvoice,
  InvoiceReminderAudit,
  InvoiceAutomationSettings,
  getStoredInvoices,
  getApproachingInvoices,
  getAutomationSettings,
  saveAutomationSettings,
  getStoredReminderAudits,
  dispatchInvoiceReminder,
  runAutomatedBatchReminders,
  markInvoiceAsPaid,
  addPendingInvoice,
  getDaysUntilDue,
  getUrgencyInfo
} from '../../services/invoiceReminderService';
import { generateInvoiceReminderEmailHtml } from '../../utils/invoiceReminderEmailTemplate';

interface InvoiceReminderManagerProps {
  onViewPayments?: () => void;
  compact?: boolean;
}

export const InvoiceReminderManager: React.FC<InvoiceReminderManagerProps> = ({
  onViewPayments,
  compact = false
}) => {
  const [invoices, setInvoices] = useState<PendingInvoice[]>([]);
  const [settings, setSettings] = useState<InvoiceAutomationSettings>(getAutomationSettings());
  const [audits, setAudits] = useState<InvoiceReminderAudit[]>([]);
  const [selectedTab, setSelectedTab] = useState<'approaching' | 'all_pending' | 'due_today' | 'reminded' | 'completed'>('approaching');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ count: number; timestamp: string } | null>(null);
  
  // Modals
  const [previewInvoice, setPreviewInvoice] = useState<PendingInvoice | null>(null);
  const [customNote, setCustomNote] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<'both' | 'email' | 'portal'>('both');
  const [isSendingSingle, setIsSendingSingle] = useState(false);
  const [sendSuccessToast, setSendSuccessToast] = useState<string | null>(null);
  
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAddInvoiceModalOpen, setIsAddInvoiceModalOpen] = useState(false);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // New Invoice Form State
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newServiceTitle, setNewServiceTitle] = useState('Annual Corporate Income Tax Assessment & Filing');
  const [newAmount, setNewAmount] = useState('20000');
  const [newDueDate, setNewDueDate] = useState('2026-10-19'); // default 2 days out

  // Load state and subscribe to changes
  const loadData = () => {
    setInvoices(getStoredInvoices());
    setSettings(getAutomationSettings());
    setAudits(getStoredReminderAudits());
  };

  useEffect(() => {
    loadData();

    const handleInvoicesUpdated = () => {
      loadData();
    };

    window.addEventListener('accounticca_invoices_updated', handleInvoicesUpdated);
    window.addEventListener('accounticca_invoice_settings_updated', handleInvoicesUpdated);
    return () => {
      window.removeEventListener('accounticca_invoices_updated', handleInvoicesUpdated);
      window.removeEventListener('accounticca_invoice_settings_updated', handleInvoicesUpdated);
    };
  }, []);

  // Filtered lists
  const approachingInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (inv.status !== 'pending') return false;
      const days = getDaysUntilDue(inv.dueDate);
      return days <= settings.approachingThresholdDays;
    });
  }, [invoices, settings.approachingThresholdDays]);

  const dueTodayOrTomorrow = useMemo(() => {
    return invoices.filter(inv => {
      if (inv.status !== 'pending') return false;
      const days = getDaysUntilDue(inv.dueDate);
      return days <= 1;
    });
  }, [invoices]);

  const displayedInvoices = useMemo(() => {
    let list: PendingInvoice[] = [];

    switch (selectedTab) {
      case 'approaching':
        list = approachingInvoices;
        break;
      case 'due_today':
        list = dueTodayOrTomorrow;
        break;
      case 'all_pending':
        list = invoices.filter(i => i.status === 'pending');
        break;
      case 'reminded':
        list = invoices.filter(i => i.remindersCount > 0);
        break;
      case 'completed':
        list = invoices.filter(i => i.status === 'completed');
        break;
      default:
        list = approachingInvoices;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(i => 
        i.clientName.toLowerCase().includes(q) ||
        (i.clientCompany && i.clientCompany.toLowerCase().includes(q)) ||
        i.invoiceNumber.toLowerCase().includes(q) ||
        i.docketNumber.toLowerCase().includes(q) ||
        i.serviceTitle.toLowerCase().includes(q)
      );
    }

    return list;
  }, [selectedTab, invoices, approachingInvoices, dueTodayOrTomorrow, searchQuery]);

  // Aggregate Metrics
  const totalPendingAmount = useMemo(() => {
    return invoices
      .filter(i => i.status === 'pending')
      .reduce((sum, i) => sum + i.amount, 0);
  }, [invoices]);

  const approachingAmount = useMemo(() => {
    return approachingInvoices.reduce((sum, i) => sum + i.amount, 0);
  }, [approachingInvoices]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Run Automated Batch Scan
  const handleRunBatchReminders = async () => {
    setIsScanning(true);
    try {
      const result = await runAutomatedBatchReminders();
      loadData();
      setScanResult({
        count: result.dispatchedCount,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      });
      setSendSuccessToast(`Automated engine dispatched ${result.dispatchedCount} reminders to approaching clients!`);
      setTimeout(() => setSendSuccessToast(null), 4000);
    } catch (err) {
      console.error('Batch scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Dispatch Single Reminder
  const handleSendSingleReminder = async (invoice: PendingInvoice, channel = selectedChannel, note = customNote) => {
    setIsSendingSingle(true);
    try {
      const res = await dispatchInvoiceReminder(invoice.id, {
        channel,
        customNote: note
      });
      if (res.success) {
        loadData();
        setSendSuccessToast(`Reminder successfully sent to ${invoice.clientName} (${channel.toUpperCase()})`);
        setPreviewInvoice(null);
        setCustomNote('');
        setTimeout(() => setSendSuccessToast(null), 4000);
      }
    } catch (err) {
      console.error('Error sending reminder:', err);
    } finally {
      setIsSendingSingle(false);
    }
  };

  // Mark as Paid
  const handleMarkPaid = (inv: PendingInvoice) => {
    const trxId = prompt(`Enter bKash TrxID or clearance voucher for ${inv.invoiceNumber} (optional):`, 'TRX-BKASH-MANUAL');
    markInvoiceAsPaid(inv.id, trxId || undefined);
    loadData();
    setSendSuccessToast(`Invoice ${inv.invoiceNumber} marked as cleared & paid.`);
    setTimeout(() => setSendSuccessToast(null), 3000);
  };

  // Add new pending invoice
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newAmount || !newDueDate) return;

    addPendingInvoice({
      invoiceNumber: `INV-2026-${Math.floor(110 + Math.random() * 890)}`,
      docketNumber: `DOCK-TAX-${Math.floor(100 + Math.random() * 900)}`,
      clientName: newClientName.trim(),
      clientCompany: newClientCompany.trim() || undefined,
      clientEmail: newClientEmail.trim() || 'billing@clientcorp.com',
      serviceTitle: newServiceTitle.trim(),
      amount: parseInt(newAmount, 10) || 15000,
      currency: 'BDT',
      issueDate: '2026-10-15',
      dueDate: newDueDate,
      status: 'pending',
      paymentMethodRequested: 'bKash Personal',
      bKashNumber: settings.bKashPaymentNumber || '01744883636'
    });

    loadData();
    setIsAddInvoiceModalOpen(false);
    setNewClientName('');
    setNewClientCompany('');
    setNewClientEmail('');
    setSendSuccessToast('New pending invoice generated with approaching due date.');
    setTimeout(() => setSendSuccessToast(null), 3000);
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveAutomationSettings(settings);
    setIsSettingsModalOpen(false);
    setSendSuccessToast('Invoice reminder automation preferences updated.');
    setTimeout(() => setSendSuccessToast(null), 3000);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-0">
      {/* Toast Notification */}
      {sendSuccessToast && (
        <div className="bg-emerald-900 text-white px-5 py-3 flex items-center justify-between text-xs font-semibold animate-fade-in border-b border-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{sendSuccessToast}</span>
          </div>
          <button 
            onClick={() => setSendSuccessToast(null)} 
            className="text-emerald-300 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner & Automation Controls */}
      <div className="p-6 sm:p-7 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-sm">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-white">
                    Automated Invoice Reminders & Due Date Alerts
                  </h2>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Automated Engine Active
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Proactively monitors pending invoices nearing due date (within {settings.approachingThresholdDays} days) and triggers formal email & portal reminders with bKash payment instructions.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/10 transition-all cursor-pointer"
              title="Configure automated reminder parameters"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>

            <button
              onClick={() => setIsAddInvoiceModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/10 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Invoice</span>
            </button>

            <button
              onClick={() => setIsAuditDrawerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-xs font-semibold text-indigo-200 border border-indigo-400/30 transition-all cursor-pointer"
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Audit Logs ({audits.length})</span>
            </button>

            <button
              onClick={handleRunBatchReminders}
              disabled={isScanning || approachingInvoices.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className={`w-3.5 h-3.5 ${isScanning ? 'animate-bounce' : ''}`} />
              <span>{isScanning ? 'Dispatching...' : `Scan & Send Reminders (${approachingInvoices.length})`}</span>
            </button>
          </div>
        </div>

        {/* Scan Status Sub-bar */}
        {scanResult && (
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Last automated batch scan at {scanResult.timestamp}: Dispatched {scanResult.count} reminders.</span>
            </div>
            <span className="text-[11px] text-slate-400">Recipient emails logged to ELA Mail Gateway</span>
          </div>
        )}
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80 bg-slate-50 border-b border-slate-200/80">
        <div className="p-4 sm:p-5">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Pending Balance</p>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">৳{totalPendingAmount.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Across {invoices.filter(i => i.status === 'pending').length} unsettled invoices</p>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Approaching Due Date
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-xl sm:text-2xl font-extrabold text-amber-900">{approachingInvoices.length} Invoices</p>
            <span className="text-xs font-semibold text-amber-700">৳{approachingAmount.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-amber-600 mt-0.5">Within {settings.approachingThresholdDays}-day threshold window</p>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            Critical (Due Today / 24h)
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-rose-900 mt-1">{dueTodayOrTomorrow.length} Invoices</p>
          <p className="text-[11px] text-rose-600 mt-0.5">Immediate intervention recommended</p>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reminders Dispatched</p>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-800 mt-1">{audits.length} Notices</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">100% Delivery via SMTP & Portal Hub</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="p-5 sm:p-6 border-b border-slate-200/80 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedTab('approaching')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedTab === 'approaching'
                  ? 'bg-amber-100 text-amber-950 border border-amber-300'
                  : 'text-slate-600 hover:bg-slate-100 border border-transparent'
              }`}
            >
              <span>Approaching Due Date</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                selectedTab === 'approaching' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {approachingInvoices.length}
              </span>
            </button>

            <button
              onClick={() => setSelectedTab('due_today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedTab === 'due_today'
                  ? 'bg-rose-100 text-rose-950 border border-rose-300'
                  : 'text-slate-600 hover:bg-slate-100 border border-transparent'
              }`}
            >
              <span>Due Today / 24h</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                {dueTodayOrTomorrow.length}
              </span>
            </button>

            <button
              onClick={() => setSelectedTab('all_pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedTab === 'all_pending'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Pending ({invoices.filter(i => i.status === 'pending').length})
            </button>

            <button
              onClick={() => setSelectedTab('reminded')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedTab === 'reminded'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Reminded ({invoices.filter(i => i.remindersCount > 0).length})
            </button>

            <button
              onClick={() => setSelectedTab('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedTab === 'completed'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cleared / Paid ({invoices.filter(i => i.status === 'completed').length})
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search client, invoice #, docket..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Invoice List Items */}
      <div className="divide-y divide-slate-100">
        {displayedInvoices.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">No invoices in this view</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {selectedTab === 'approaching'
                  ? 'All pending client invoices have comfortable settlement horizons beyond the configured threshold.'
                  : 'Try selecting a different filter tab or adjusting your search keyword.'}
              </p>
            </div>
          </div>
        ) : (
          displayedInvoices.map((inv) => {
            const daysRemaining = getDaysUntilDue(inv.dueDate);
            const urgency = getUrgencyInfo(daysRemaining);
            const isCompleted = inv.status === 'completed';

            return (
              <div 
                key={inv.id} 
                className={`p-5 sm:p-6 transition-colors hover:bg-slate-50/80 ${
                  urgency.key === 'due_today' && !isCompleted ? 'bg-rose-50/30' : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Client & Matter */}
                  <div className="space-y-2 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">
                        {inv.clientName}
                      </span>
                      {inv.clientCompany && (
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {inv.clientCompany}
                        </span>
                      )}
                      
                      {/* Urgency / Status Indicator */}
                      {isCompleted ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Settled / Cleared
                        </span>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${urgency.badgeClass}`}>
                          {urgency.label}
                        </span>
                      )}

                      {inv.remindersCount > 0 && (
                        <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-semibold">
                          Reminded ×{inv.remindersCount}
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-medium text-slate-700">
                      {inv.serviceTitle}
                    </p>

                    {/* Metadata text without pill boxes */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-mono font-medium text-slate-600">
                        Inv: {inv.invoiceNumber}
                        <button 
                          onClick={() => handleCopy(inv.invoiceNumber)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Copy Invoice ID"
                        >
                          {copiedText === inv.invoiceNumber ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </span>
                      <span>·</span>
                      <span>Docket: {inv.docketNumber}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {inv.clientEmail}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Due: {inv.dueDate}
                      </span>
                    </div>

                    {inv.lastReminderSentAt && (
                      <p className="text-[11px] text-indigo-600 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last reminder sent {new Date(inv.lastReminderSentAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })} via {inv.lastReminderType === 'both' ? 'Email & Portal' : inv.lastReminderType?.toUpperCase()}
                      </p>
                    )}
                  </div>

                  {/* Right Column: Amount & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="sm:text-right">
                      <div className="text-xs text-slate-500 font-semibold">Payable Balance</div>
                      <div className="text-xl font-extrabold text-slate-900">৳{inv.amount.toLocaleString()}</div>
                      <div className="text-[10px] text-pink-700 font-semibold flex items-center sm:justify-end gap-1">
                        <span>bKash Personal: {inv.bKashNumber}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isCompleted ? (
                        <>
                          <button
                            onClick={() => {
                              setPreviewInvoice(inv);
                              setCustomNote('');
                            }}
                            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                            title="Preview and customize the formal email notice"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>

                          <button
                            onClick={() => handleSendSingleReminder(inv, 'both')}
                            disabled={isSendingSingle}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                            title="Dispatch automated reminder now via Email & Portal"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Auto-Remind</span>
                          </button>

                          <button
                            onClick={() => handleMarkPaid(inv)}
                            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
                            title="Mark invoice as settled/paid"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Mark Paid</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Cleared & Accounted</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Instructions Box */}
      <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Automated reminders enforce standard corporate terms and include direct bKash Personal settlement details (<strong>{settings.bKashPaymentNumber}</strong>).
          </span>
        </div>
        {onViewPayments && (
          <button
            onClick={onViewPayments}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>Open Payment Status Tracker</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Email Preview & Customization Modal */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Review Client Reminder Notice</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Invoice {previewInvoice.invoiceNumber} · Recipient: {previewInvoice.clientEmail}
                </p>
              </div>
              <button
                onClick={() => setPreviewInvoice(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Channel Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Dispatch Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('both')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      selectedChannel === 'both'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    Email & Portal Notice
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('email')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      selectedChannel === 'email'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    Email Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('portal')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      selectedChannel === 'portal'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    Portal Notice Only
                  </button>
                </div>
              </div>

              {/* Optional Custom Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Counsel Advisory Note (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please note that return filing submission at Tax Circle 14 requires bank clearance by 4:00 PM."
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Formatted Preview Box */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-800">Email Preview Mockup</span>
                  <span className="text-[11px] text-slate-500 font-mono">Template: statutory_due_reminder_v2</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 text-xs text-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{previewInvoice.clientName}</p>
                      <p className="text-[11px] text-slate-500">{previewInvoice.clientCompany || 'Corporate Retainer'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-sm text-slate-900">৳{previewInvoice.amount.toLocaleString()}</p>
                      <p className="text-[11px] text-amber-700 font-bold">Due: {previewInvoice.dueDate}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-pink-50 border border-pink-200 rounded-xl space-y-1">
                    <p className="font-bold text-pink-900 text-[11px]">Payment Instructions (Only bKash Personal):</p>
                    <p className="text-slate-700 text-[11px]">
                      Send Money of exactly <strong>BDT {previewInvoice.amount.toLocaleString()}</strong> to bKash Personal: <strong>{previewInvoice.bKashNumber}</strong>.
                    </p>
                    <p className="text-slate-600 text-[10px]">
                      Enter your Transaction ID (TrxID) in the Client Portal to confirm receipt.
                    </p>
                  </div>

                  {customNote && (
                    <div className="p-2.5 bg-amber-50 border-l-2 border-amber-400 text-amber-900 text-[11px] italic">
                      "{customNote}"
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setPreviewInvoice(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleSendSingleReminder(previewInvoice)}
                disabled={isSendingSingle}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingSingle ? 'Dispatching...' : 'Confirm & Dispatch Reminder'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Automation Configuration</h3>
                <p className="text-xs text-slate-400 mt-0.5">Parameters for scheduled reminder engine</p>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 space-y-4 text-xs">
              <div>
                <label className="flex items-center justify-between font-bold text-slate-800">
                  <span>Enable Automated Reminders</span>
                  <input
                    type="checkbox"
                    checked={settings.autoRemindersEnabled}
                    onChange={(e) => setSettings({ ...settings, autoRemindersEnabled: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 cursor-pointer"
                  />
                </label>
                <p className="text-slate-500 mt-1">Runs daily automated background scan across all pending invoices.</p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Due Date Alert Threshold
                </label>
                <select
                  value={settings.approachingThresholdDays}
                  onChange={(e) => setSettings({ ...settings, approachingThresholdDays: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  <option value={1}>1 Day Before Due Date (High Urgency)</option>
                  <option value={2}>2 Days Before Due Date</option>
                  <option value={3}>3 Days Before Due Date (Recommended)</option>
                  <option value={5}>5 Days Before Due Date</option>
                  <option value={7}>7 Days Before Due Date</option>
                </select>
                <p className="text-slate-500 mt-1">Clients will receive automated notices once invoice maturity reaches this limit.</p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Default Dispatch Channels
                </label>
                <select
                  value={settings.defaultChannels}
                  onChange={(e) => setSettings({ ...settings, defaultChannels: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  <option value="both">Both Email & Portal Notification</option>
                  <option value="email">Email Only</option>
                  <option value="portal">Portal Notification Only</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Firm bKash Personal Number
                </label>
                <input
                  type="text"
                  value={settings.bKashPaymentNumber}
                  onChange={(e) => setSettings({ ...settings, bKashPaymentNumber: e.target.value })}
                  placeholder="01744883636"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Pending Invoice Modal */}
      {isAddInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Generate Pending Invoice</h3>
                <p className="text-xs text-slate-400 mt-0.5">Test invoice reminder triggers</p>
              </div>
              <button
                onClick={() => setIsAddInvoiceModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Client Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahfuzur Rahman"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Company / Organization</label>
                <input
                  type="text"
                  placeholder="e.g. Beximco Group Ltd"
                  value={newClientCompany}
                  onChange={(e) => setNewClientCompany(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Client Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. accounts@client.com"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Amount (BDT) *</label>
                  <input
                    type="number"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Due Date (Approaching) *</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Service / Engagement Title</label>
                <input
                  type="text"
                  value={newServiceTitle}
                  onChange={(e) => setNewServiceTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddInvoiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Drawer / Modal */}
      {isAuditDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Invoice Reminder Audit Trails</h3>
                <p className="text-xs text-slate-400 mt-0.5">Historical record of all dispatched email & portal reminders</p>
              </div>
              <button
                onClick={() => setIsAuditDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 divide-y divide-slate-100 text-xs">
              {audits.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No automated reminders sent yet.</p>
              ) : (
                audits.map((a) => (
                  <div key={a.id} className="py-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{a.clientName}</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(a.sentAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-slate-600">{a.subject}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1">
                      <span className="bg-slate-100 px-2 py-0.5 rounded font-mono">Inv: {a.invoiceNumber}</span>
                      <span>·</span>
                      <span>Channel: {a.channel.toUpperCase()}</span>
                      <span>·</span>
                      <span className="text-emerald-700 font-semibold">{a.transport}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setIsAuditDrawerOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
              >
                Close Audit Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
