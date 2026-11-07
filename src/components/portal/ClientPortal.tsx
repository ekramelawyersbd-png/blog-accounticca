import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Video, 
  Building2, 
  FileText, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  Plus, 
  Upload, 
  Eye, 
  Copy, 
  Check, 
  Lock, 
  Sparkles, 
  Briefcase, 
  Scale, 
  Calculator, 
  FileSpreadsheet, 
  Layers, 
  ArrowRight, 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  Printer, 
  Share2, 
  LogIn, 
  ChevronRight,
  BadgeCheck,
  RefreshCw,
  FolderOpen,
  CreditCard,
  BellRing,
  CalendarDays
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePurchases } from '../../contexts/PurchaseContext';
import { getStoredPortalNotifications, ClientPortalNotification } from '../../services/invoiceReminderService';
import { Appointment, fetchUserAppointments, getGoogleCalendarUrl, downloadIcsFile } from '../../services/appointmentService';
import { 
  ClientDocument, 
  fetchClientDocuments, 
  downloadClientDocumentPDF 
} from '../../services/clientDocumentService';
import { DocumentViewerModal } from './DocumentViewerModal';
import { UploadDocumentModal } from './UploadDocumentModal';
import { PaymentHistory } from './PaymentHistory';
import { SharedClientCalendar } from './SharedClientCalendar';
import { ClientBookingDashboard } from '../ClientBookingDashboard';

export const ClientPortal: React.FC = () => {
  const { user, authUser, signInWithGoogle, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active sub-tab state (overview | consultations | documents | payments | calendar | chambers)
  const tabParam = searchParams.get('tab');
  const [activePortalTab, setActivePortalTab] = useState<'overview' | 'consultations' | 'documents' | 'payments' | 'calendar' | 'chambers'>(() => {
    if (tabParam === 'consultations' || tabParam === 'appointments') return 'consultations';
    if (tabParam === 'documents' || tabParam === 'vault') return 'documents';
    if (tabParam === 'payments' || tabParam === 'billing' || tabParam === 'receipts' || tabParam === 'invoices') return 'payments';
    if (tabParam === 'calendar' || tabParam === 'schedule' || tabParam === 'deadlines') return 'calendar';
    if (tabParam === 'chambers') return 'chambers';
    return 'overview';
  });

  // Sync tab with URL
  useEffect(() => {
    if (tabParam === 'consultations' || tabParam === 'appointments') {
      setActivePortalTab('consultations');
    } else if (tabParam === 'documents' || tabParam === 'vault') {
      setActivePortalTab('documents');
    } else if (tabParam === 'payments' || tabParam === 'billing' || tabParam === 'receipts' || tabParam === 'invoices') {
      setActivePortalTab('payments');
    } else if (tabParam === 'calendar' || tabParam === 'schedule' || tabParam === 'deadlines') {
      setActivePortalTab('calendar');
    } else if (tabParam === 'chambers') {
      setActivePortalTab('chambers');
    }
  }, [tabParam]);

  const handleSelectTab = (tab: 'overview' | 'consultations' | 'documents' | 'payments' | 'calendar' | 'chambers') => {
    setActivePortalTab(tab);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    }, { replace: true });
  };

  const { transactions, purchasedProductIds, pendingProductIds, activeUserId, activeUserEmail, downloadReceipt } = usePurchases();

  // Demo mode toggle if user is unauthenticated
  const [demoMode, setDemoMode] = useState(false);

  // Consultations state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [consultationStatusFilter, setConsultationStatusFilter] = useState<string>('all');
  const [consultationSearch, setConsultationSearch] = useState('');

  // Documents state
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [docCategoryFilter, setDocCategoryFilter] = useState<string>('All');
  const [docStatusFilter, setDocStatusFilter] = useState<string>('All');
  const [docSearch, setDocSearch] = useState('');

  // Modals
  const [viewingDocument, setViewingDocument] = useState<ClientDocument | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const activeUser = user || authUser || (activeUserId ? {
    uid: activeUserId,
    displayName: activeUserEmail ? activeUserEmail.split('@')[0] : 'Verified Client',
    email: activeUserEmail || 'verified.client@accounticca.com'
  } as any : null) || (demoMode ? {
    uid: 'demo-client-uid',
    displayName: 'Mahfuzur Rahman (Apex Global Ltd.)',
    email: 'client.executive@apex-global.com'
  } as any : null);

  // Load consultations
  useEffect(() => {
    if (!activeUser) {
      setIsLoadingAppointments(false);
      return;
    }

    setIsLoadingAppointments(true);
    fetchUserAppointments(activeUser.uid, activeUser.email || undefined)
      .then(apps => {
        setAppointments(apps);
      })
      .catch(err => {
        console.warn('Error loading user consultations:', err);
      })
      .finally(() => {
        setIsLoadingAppointments(false);
      });
  }, [activeUser]);

  // Load documents
  useEffect(() => {
    if (!activeUser) {
      setIsLoadingDocuments(false);
      return;
    }

    setIsLoadingDocuments(true);
    fetchClientDocuments(activeUser.uid, activeUser.displayName || 'Corporate Partner', activeUser.email || 'client@accounticca.com')
      .then(docs => {
        setDocuments(docs);
      })
      .catch(err => {
        console.warn('Error loading client documents:', err);
      })
      .finally(() => {
        setIsLoadingDocuments(false);
      });
  }, [activeUser]);

  // Invoice Reminder Portal Notifications
  const [portalNotifications, setPortalNotifications] = useState<ClientPortalNotification[]>(() => getStoredPortalNotifications());

  useEffect(() => {
    const handleNotifs = () => {
      setPortalNotifications(getStoredPortalNotifications());
    };
    window.addEventListener('accounticca_portal_notifications_updated', handleNotifs);
    return () => window.removeEventListener('accounticca_portal_notifications_updated', handleNotifs);
  }, []);

  const handleDismissNotification = (id: string) => {
    setPortalNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      try {
        localStorage.setItem('accounticca_client_portal_notifications', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Filtered consultations
  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      // Status filter
      if (consultationStatusFilter === 'active') {
        if (app.status === 'Cancelled' || app.status === 'Completed') return false;
      } else if (consultationStatusFilter === 'completed') {
        if (app.status !== 'Completed') return false;
      } else if (consultationStatusFilter === 'cancelled') {
        if (app.status !== 'Cancelled') return false;
      }

      // Search query
      if (consultationSearch.trim()) {
        const q = consultationSearch.toLowerCase();
        const matchesRef = app.referenceId.toLowerCase().includes(q);
        const matchesPractice = app.practiceArea.toLowerCase().includes(q);
        const matchesExpertise = (app.expertiseArea || '').toLowerCase().includes(q);
        const matchesNotes = (app.notes || '').toLowerCase().includes(q);
        return matchesRef || matchesPractice || matchesExpertise || matchesNotes;
      }

      return true;
    });
  }, [appointments, consultationStatusFilter, consultationSearch]);

  // Next upcoming consultation
  const nextConsultation = useMemo(() => {
    const upcoming = appointments.filter(a => a.status === 'Confirmed' || a.status === 'Pending');
    return upcoming[0] || null;
  }, [appointments]);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(docItem => {
      if (docCategoryFilter !== 'All' && docItem.category !== docCategoryFilter) {
        return false;
      }
      if (docStatusFilter !== 'All' && docItem.status !== docStatusFilter) {
        return false;
      }
      if (docSearch.trim()) {
        const q = docSearch.toLowerCase();
        const matchesTitle = docItem.title.toLowerCase().includes(q);
        const matchesSub = (docItem.subtitle || '').toLowerCase().includes(q);
        const matchesSummary = docItem.summary.toLowerCase().includes(q);
        const matchesRef = (docItem.consultationRef || '').toLowerCase().includes(q);
        const matchesVer = (docItem.verificationCode || '').toLowerCase().includes(q);
        return matchesTitle || matchesSub || matchesSummary || matchesRef || matchesVer;
      }
      return true;
    });
  }, [documents, docCategoryFilter, docStatusFilter, docSearch]);

  const handleCopyRef = (refId: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(refId);
      setCopiedRef(refId);
      setTimeout(() => setCopiedRef(null), 2000);
    }
  };

  const handleDocumentUploaded = (newDoc: ClientDocument) => {
    setDocuments(prev => [newDoc, ...prev]);
  };

  const handleFilterDocsByConsultation = (refId: string) => {
    setDocSearch(refId);
    handleSelectTab('documents');
  };

  // If user is not authenticated and demo mode is off, show the secure sign-in gateway
  if (!activeUser) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-6 sm:p-12 text-center max-w-4xl mx-auto my-6 space-y-8 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-sm border border-emerald-200">
          <ShieldCheck className="w-9 h-9" />
        </div>

        <div className="max-w-xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted Corporate Client Portal</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Track Ongoing Consultations &amp; Access Shared Legal/Tax Documents
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Welcome to the centralized Accounticca &amp; E-Lawyers Client Portal. Sign in to monitor live consultation milestones, access certified tax assessment orders, view High Court writ dockets, and upload matter documentation.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <Clock className="w-5 h-5 text-emerald-600 mb-1" />
            <h4 className="font-bold text-slate-900">Milestone Tracking</h4>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Follow pre-screening, partner review, and post-session advisory deliverables in real time.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <FileText className="w-5 h-5 text-emerald-600 mb-1" />
            <h4 className="font-bold text-slate-900">Shared Document Vault</h4>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Download official NBR assessment dockets, Mushak 9.1 returns, and High Court filings with verification codes.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <BadgeCheck className="w-5 h-5 text-emerald-600 mb-1" />
            <h4 className="font-bold text-slate-900">Chamber Partner Desk</h4>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Direct communication link to assigned Senior Advocates and Chartered Accountants.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Access Client Portal</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoMode(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer border border-slate-300"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Explore Portal Preview</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Client Header Welcome Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
        {/* Subtle decorative mesh background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Client Privilege</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Panthapath Chambers • Dhaka-1205
              </span>
              {demoMode && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-900">
                  Preview Mode
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Client Advisory Portal</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Logged in as <strong>{activeUser.displayName || 'Authorized Client'}</strong> ({activeUser.email}). Monitor ongoing consultation milestones, retrieve verified tax &amp; legal documents, and communicate with your assigned chamber team.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              to="/contact?tab=appointment"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Book New Consultation</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-800/80 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Consultations</span>
            <span className="text-lg font-black text-white">{appointments.length} Sessions</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Shared Documents</span>
            <span className="text-lg font-black text-emerald-400">{documents.length} Files in Vault</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Next Scheduled Date</span>
            <span className="text-sm font-bold text-white truncate block">
              {nextConsultation ? `${nextConsultation.date}` : 'None Scheduled'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Chamber Hotline</span>
            <span className="text-xs font-mono font-bold text-slate-200">+880 1335-230170</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200/90 shadow-2xs flex items-center overflow-x-auto gap-1">
        <button
          type="button"
          onClick={() => handleSelectTab('overview')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activePortalTab === 'overview'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab('consultations')}
          className={`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activePortalTab === 'consultations'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Ongoing Consultations</span>
          <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
            activePortalTab === 'consultations' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {appointments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab('documents')}
          className={`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activePortalTab === 'documents'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>Shared Documents Vault</span>
          <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
            activePortalTab === 'documents' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {documents.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab('payments')}
          className={`flex-1 min-w-[160px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activePortalTab === 'payments'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-400" />
          <span>Payment History</span>
          <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
            activePortalTab === 'payments' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {transactions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab('calendar')}
          className={`flex-1 min-w-[160px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activePortalTab === 'calendar'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CalendarDays className="w-4 h-4 text-emerald-400" />
          <span>Shared Calendar</span>
          <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
            activePortalTab === 'calendar' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            Live
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab('chambers')}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activePortalTab === 'chambers'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span>Chamber Desk</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activePortalTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Purchased Products & Digital Toolkits Vault */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200/90 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                  <BadgeCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-black text-slate-900">
                      My Purchased Products, Courses &amp; Toolkits
                    </h3>
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {purchasedProductIds.length} Active
                    </span>
                    {pendingProductIds.length > 0 && (
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        {pendingProductIds.length} Pending Verification
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verified purchases permanently linked to User ID <strong className="font-mono text-slate-700">{activeUser.uid}</strong> ({activeUser.email})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to="/tools"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                >
                  <span>Browse Tools &amp; Resources</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {transactions.filter(t => t.status === 'completed' || t.status === 'pending').length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-3">
                <FileSpreadsheet className="w-9 h-9 text-slate-300 mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-slate-800">No Digital Products Purchased Yet</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Any tax calculator workbook, legal template kit, or academy course you purchase with this account will automatically unlock here across all devices.
                  </p>
                </div>
                <Link
                  to="/tools"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
                >
                  <span>Explore Compliance Tools</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {transactions
                  .filter(t => t.status === 'completed' || t.status === 'pending')
                  .map(tx => {
                    const isVerified = tx.status === 'completed';
                    const productPath = tx.productSlug
                      ? `/shop/${tx.productSlug}`
                      : tx.productId.startsWith('prod-')
                      ? `/shop/${tx.productId}`
                      : '/tools';

                    return (
                      <div
                        key={tx.id}
                        className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between gap-4 transition-all ${
                          isVerified
                            ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
                            : 'bg-amber-50/40 border-amber-200'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                                isVerified
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : 'bg-amber-100 text-amber-800 border-amber-200'
                              }`}
                            >
                              {isVerified ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Verified · Access Active</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Pending Verification</span>
                                </>
                              )}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-slate-600">
                              Order: {tx.orderId || tx.referenceId || tx.transactionId}
                            </span>
                          </div>

                          <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                            {tx.productTitle}
                          </h4>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                            <span>Settled: <strong className="text-slate-800">BDT {tx.amount.toLocaleString('en-IN')}</strong></span>
                            <span>•</span>
                            <span>{tx.paymentMethod}</span>
                            <span>•</span>
                            <span>{new Date(tx.date).toLocaleDateString('en-GB')}</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2">
                          <Link
                            to={productPath}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold transition-colors shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Product</span>
                          </Link>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => downloadReceipt(tx)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Receipt</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectTab('payments')}
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <span>Manage</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Client Portal Notifications from Invoice Reminder Engine */}
          {portalNotifications.length > 0 && (
            <div className="bg-amber-50/90 border border-amber-300 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <BellRing className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                        Portal Notice · Pending Invoice Approaching Due Date
                      </span>
                      <span className="text-[10px] font-bold bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full">
                        Action Required
                      </span>
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                      {portalNotifications[0].title}
                    </h4>
                  </div>
                </div>
                <button 
                  onClick={() => handleDismissNotification(portalNotifications[0].id)}
                  className="text-amber-800 hover:text-amber-950 text-xs font-bold cursor-pointer"
                  title="Dismiss notification"
                >
                  ✕
                </button>
              </div>
              
              <p className="text-xs text-slate-700 leading-relaxed">
                {portalNotifications[0].message}
              </p>

              {/* bKash instructions highlight */}
              <div className="bg-white p-3.5 rounded-2xl border border-pink-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-800 space-y-0.5">
                  <span className="font-bold text-pink-700 block text-xs">Payment Instructions (Only bKash Personal):</span>
                  <span className="text-slate-600 block">
                    Please Send Money of exact amount <strong>BDT {portalNotifications[0].amount.toLocaleString()}</strong> to bKash Personal: <strong className="text-pink-700 font-mono text-xs">{portalNotifications[0].bKashNumber}</strong>.
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    After transaction, enter your Transaction ID (TrxID) in Payment History to confirm clearance.
                  </span>
                </div>
                <button
                  onClick={() => handleSelectTab('payments')}
                  className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs transition-colors"
                >
                  Go to Payments &amp; Enter TrxID
                </button>
              </div>
            </div>
          )}

          {/* Active / Next Consultation Highlight Banner */}
          {nextConsultation ? (
            <div className="bg-white rounded-3xl p-6 border border-emerald-300 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-widest">
                    Next Active Consultation • {nextConsultation.referenceId}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-100/80 px-3 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Scheduled for {nextConsultation.date} ({nextConsultation.timeSlot.split(' ')[0]} {nextConsultation.timeSlot.split(' ')[1]})</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-2 space-y-2">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">
                    {nextConsultation.practiceArea}
                  </h3>
                  {nextConsultation.expertiseArea && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <span>Specific Focus:</span>
                      <span className="font-bold">{nextConsultation.expertiseArea}</span>
                    </div>
                  )}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {nextConsultation.notes || 'Executive consultation scoping scheduled with chamber senior partner.'}
                  </p>
                </div>

                <div className="flex flex-col gap-2 shrink-0 md:border-l md:border-slate-100 md:pl-4">
                  {nextConsultation.mode === 'virtual' ? (
                    <a
                      href={nextConsultation.meetingLink || 'https://meet.google.com/qmv-trcx-vny'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                    >
                      <Video className="w-4 h-4" />
                      <span>Join Google Meet Video</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>
                  ) : (
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=BTI+Centara+Grand+144+Green+Road+Panthapath+Dhaka+1205"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all"
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Chamber Directions (Dhaka)</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleFilterDocsByConsultation(nextConsultation.referenceId)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>View Associated Documents</span>
                  </button>
                </div>
              </div>

              {/* Consultation Milestone Stepper */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Matter Progression Milestones
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900 block text-[11px]">1. Intake &amp; Scoped</span>
                      <span className="text-[10px] text-emerald-700">Completed</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900 block text-[11px]">2. Partner Review</span>
                      <span className="text-[10px] text-emerald-700">In Progress</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-700 block text-[11px]">3. Session Active</span>
                      <span className="text-[10px] text-slate-400">{nextConsultation.date}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-700 block text-[11px]">4. Post-Session Deliverable</span>
                      <span className="text-[10px] text-slate-400">Vault Dispatch</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Consultations Currently Scheduled</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Need specialized counsel on corporate tax audits, VAT 9.1 returns, or High Court litigation? Book a session with our partners.
              </p>
              <Link
                to="/contact?tab=appointment"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Consultation Session</span>
              </Link>
            </div>
          )}

          {/* Quick Access to Recent Shared Documents */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Recent Shared Legal &amp; Tax Documents</span>
                  <span className="text-xs font-bold text-slate-400">({documents.length} Total)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Certified filings, assessment orders, and agreements shared directly with your account
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSelectTab('documents')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Vault ({documents.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {documents.slice(0, 4).map((docItem) => (
                <div
                  key={docItem.id}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/90 hover:bg-white hover:border-emerald-300 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {docItem.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {docItem.fileType.toUpperCase()} • {docItem.fileSize}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-1">
                      {docItem.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {docItem.summary}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400">
                      By {docItem.author.name}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setViewingDocument(docItem)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-slate-500" />
                        <span>Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadClientDocumentPDF(docItem)}
                        className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shared Compliance & Meeting Calendar Section */}
          <div className="pt-2">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-7 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                      Active Profile Calendar Sync
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Live
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-0.5">
                    Upcoming Tax Filing Deadlines &amp; Scheduled Meetings
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl">
                    Unified calendar tracking statutory tax filing milestones, monthly VAT 9.1 schedules, and direct chamber video consultations synced with your corporate profile.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSelectTab('calendar')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>Open Full Shared Calendar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Payment History & Digital Receipts Section */}
          <div className="pt-2">
            <PaymentHistory compact limit={3} onViewAll={() => handleSelectTab('payments')} />
          </div>
        </div>
      )}

      {/* TAB 2: ONGOING CONSULTATIONS */}
      {activePortalTab === 'consultations' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <ClientBookingDashboard
            title="Scheduled Consultations & Booking Manager"
            subtitle="View upcoming appointments, track real-time /workspace calendar sync and 3-hour advance reminders, or cancel bookings if necessary."
          />

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Consultation Case Files &amp; Deliverables
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track chamber partner assignments, live video links, and associated document deliverables
              </p>
            </div>

            <Link
              to="/contact?tab=appointment"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Appointment</span>
            </Link>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={consultationSearch}
                onChange={(e) => setConsultationSearch(e.target.value)}
                placeholder="Search by reference ID (APT-...), practice area, or agenda..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              {[
                { id: 'all', label: 'All Sessions' },
                { id: 'active', label: 'In Progress / Upcoming' },
                { id: 'completed', label: 'Completed' },
                { id: 'cancelled', label: 'Cancelled' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setConsultationStatusFilter(f.id)}
                  className={`text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    consultationStatusFilter === f.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Consultations List */}
          {isLoadingAppointments ? (
            <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span>Loading your consultations...</span>
            </div>
          ) : filteredAppointments.length > 0 ? (
            <div className="space-y-4">
              {filteredAppointments.map((apt) => {
                const isConfirmed = apt.status === 'Confirmed' || apt.status === 'Pending';
                return (
                  <div
                    key={apt.referenceId}
                    className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all space-y-4"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                          <span>{apt.referenceId}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyRef(apt.referenceId)}
                            title="Copy Ref ID"
                            className="text-emerald-700 hover:text-emerald-950 transition-colors"
                          >
                            {copiedRef === apt.referenceId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </span>

                        <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          apt.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          apt.status === 'Completed' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                          apt.status === 'Cancelled' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                          'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          ● {apt.status}
                        </span>

                        <span className="text-xs text-slate-500">
                          {apt.division || 'Accounticca Advisory'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{apt.date}</span>
                        <span className="text-slate-300">•</span>
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{apt.timeSlot}</span>
                      </div>
                    </div>

                    {/* Main Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2 space-y-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {apt.practiceArea}
                        </h3>

                        {apt.expertiseArea && (
                          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-900 bg-emerald-50/90 px-2.5 py-0.5 rounded-md border border-emerald-200 font-medium">
                            <span className="text-emerald-700 font-bold">Specialized Area:</span>
                            <span>{apt.expertiseArea}</span>
                          </div>
                        )}

                        {apt.notes && (
                          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <strong className="text-slate-700">Client Agenda / Matter Notes: </strong>
                            {apt.notes}
                          </p>
                        )}
                      </div>

                      {/* Partner & Location Info */}
                      <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 text-xs space-y-2 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            Assigned Chamber Desk
                          </span>
                          <span className="font-bold text-slate-900 block">
                            {apt.assignedPartner?.name || 'Senior Practice Partner'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {apt.mode === 'virtual' ? 'Virtual Google Meet Session' : 'Panthapath Chambers, Dhaka'}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Consultation Format:</span>
                          <span className="font-bold text-emerald-800 flex items-center gap-1">
                            {apt.mode === 'virtual' ? <Video className="w-3.5 h-3.5 text-emerald-600" /> : <Building2 className="w-3.5 h-3.5 text-emerald-600" />}
                            <span>{apt.mode === 'virtual' ? 'Google Meet' : 'Chamber'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Milestone Bar */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-bold text-[11px]">1. Scoped</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-bold text-[11px]">2. Partner Assigned</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${isConfirmed ? 'text-emerald-800' : 'text-slate-400'}`}>
                          {isConfirmed ? <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                          <span className="font-bold text-[11px]">3. Consultation Ready</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${apt.status === 'Completed' ? 'text-emerald-800' : 'text-slate-400'}`}>
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold text-[11px]">4. Deliverable File</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="pt-1 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        {apt.mode === 'virtual' ? (
                          <a
                            href={apt.meetingLink || 'https://meet.google.com/qmv-trcx-vny'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Video Session</span>
                            <ExternalLink className="w-3 h-3 opacity-80" />
                          </a>
                        ) : (
                          <a
                            href="https://www.google.com/maps/search/?api=1&query=BTI+Centara+Grand+144+Green+Road+Panthapath+Dhaka+1205"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xs"
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Chamber Location Map</span>
                            <ExternalLink className="w-3 h-3 opacity-80" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleFilterDocsByConsultation(apt.referenceId)}
                          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                        >
                          Associated Documents
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={getGoogleCalendarUrl(apt)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold inline-flex items-center gap-1 transition-colors"
                          title="Add to Google Calendar"
                        >
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>G-Calendar</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => downloadIcsFile(apt)}
                          className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title="Download .ics Calendar Invite"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          <span>.ics</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No consultations matching your current filter.</p>
            </div>
          )}
          </div>
        </div>
      )}

      {/* TAB 3: SHARED LEGAL & TAX DOCUMENTS VAULT */}
      {activePortalTab === 'documents' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Shared Legal &amp; Tax Documents Vault</span>
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  AES-256 Encrypted
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official assessment orders, High Court writ drafts, VAT filings, and client matter uploads
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document to Vault</span>
            </button>
          </div>

          {/* Category Filter Pills & Search */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  placeholder="Search documents by title, verification code, or consultation ref..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              {/* Status Filter */}
              <select
                value={docStatusFilter}
                onChange={(e) => setDocStatusFilter(e.target.value)}
                className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
              >
                <option value="All">All Statuses</option>
                <option value="Certified">Certified</option>
                <option value="Filed">Filed</option>
                <option value="Ready for Signature">Ready for Signature</option>
                <option value="Client Review Required">Client Review Required</option>
                <option value="Chamber Scoping">Chamber Scoping</option>
              </select>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                'All',
                'Tax Filings & NBR',
                'Legal Deeds & Contracts',
                'VAT & Customs',
                'Assurance & Audit',
                'Advisory Memos'
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setDocCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    docCategoryFilter === cat
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filter Notice if searching by consultation ref */}
          {docSearch.startsWith('APT-') && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
              <span>Showing documents filtered for consultation <strong>{docSearch}</strong></span>
              <button
                type="button"
                onClick={() => setDocSearch('')}
                className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
              >
                Clear Filter
              </button>
            </div>
          )}

          {/* Document Cards Grid */}
          {isLoadingDocuments ? (
            <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span>Deciphering and loading client vault...</span>
            </div>
          ) : filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDocuments.map((docItem) => (
                <div
                  key={docItem.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {docItem.category}
                      </span>

                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                        docItem.status === 'Certified' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        docItem.status === 'Filed' ? 'bg-teal-50 text-teal-800 border-teal-200' :
                        docItem.status === 'Ready for Signature' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                        'bg-amber-50 text-amber-900 border-amber-200'
                      }`}>
                        ● {docItem.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors leading-snug">
                      {docItem.title}
                    </h3>

                    {docItem.subtitle && (
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {docItem.subtitle}
                      </p>
                    )}

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {docItem.summary}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-1">
                      <span>Shared: <strong>{docItem.sharedDate}</strong></span>
                      <span className="font-mono text-emerald-700 font-bold">
                        {docItem.verificationCode || 'VERIFIED'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="text-[11px] text-slate-400">
                        By {docItem.author.name.slice(0, 26)}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingDocument(docItem)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>View Provisions</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => downloadClientDocumentPDF(docItem)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download PDF</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <FolderOpen className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No documents matching your search or category filter.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CHAMBER DESK & SENIOR LEADS */}
      {activePortalTab === 'chambers' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6 animate-in fade-in duration-150">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Chamber Advisory Desk &amp; Partner Coordinates
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct communication channels with Accounticca Advisory &amp; E-Lawyers Supreme Court Benches
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Accounticca Advisory Desk */}
            <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                  A
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Accounticca Advisory Desk</h3>
                  <span className="text-[11px] text-emerald-800 font-semibold">Direct Tax, VAT &amp; Assurance Wing</span>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed text-xs">
                Headed by senior Fellow Chartered Accountants (ICAB) and NBR Certified Income Tax Practitioners. Handles corporate assessments, transfer pricing, and VAT audit defenses.
              </p>

              <div className="pt-2 border-t border-emerald-200/60 space-y-1.5 font-mono text-[11px] text-slate-700">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Hotline: +880 1335-230170 Ext. 1</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Email: tax-advisory@accounticca.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Suite G-5, BTI Centara Grand, Panthapath, Dhaka</span>
                </div>
              </div>
            </div>

            {/* E-Lawyers Chambers Desk */}
            <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-blue-700 text-white flex items-center justify-center font-black">
                  E
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">E-Lawyers Chambers Desk</h3>
                  <span className="text-[11px] text-blue-800 font-semibold">High Court Division &amp; Commercial Benches</span>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed text-xs">
                Headed by Advocates of the Supreme Court of Bangladesh and Barristers-at-Law. Handles High Court writ petitions, commercial arbitration, shareholder litigation, and RJSC compliance.
              </p>

              <div className="pt-2 border-t border-blue-200/60 space-y-1.5 font-mono text-[11px] text-slate-700">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>Chamber Desk: +880 1335-230170 Ext. 2</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Email: litigation@elawyersbd.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Supreme Court Bar Association Annex &amp; Panthapath Chambers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENT HISTORY & DIGITAL RECEIPTS */}
      {activePortalTab === 'payments' && (
        <div className="animate-in fade-in duration-150">
          <PaymentHistory />
        </div>
      )}

      {/* TAB 5: SHARED COMPLIANCE & MEETING CALENDAR */}
      {activePortalTab === 'calendar' && (
        <div className="animate-in fade-in duration-150">
          <SharedClientCalendar
            appointments={appointments}
            activeUser={activeUser}
            onScheduleConsultation={() => handleSelectTab('consultations')}
          />
        </div>
      )}

      {/* Modals */}
      <DocumentViewerModal
        document={viewingDocument}
        isOpen={!!viewingDocument}
        onClose={() => setViewingDocument(null)}
      />

      <UploadDocumentModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        userId={activeUser.uid}
        userName={activeUser.displayName || 'Corporate Client'}
        userEmail={activeUser.email || 'client@accounticca.com'}
        appointments={appointments}
        onDocumentUploaded={handleDocumentUploaded}
      />
    </div>
  );
};
