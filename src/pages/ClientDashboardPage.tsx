import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  FolderOpen,
  Lock,
  MapPin,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  Upload,
  Video,
  X,
  XCircle,
  AlertCircle,
  BookOpen,
  Building2,
  Scale,
  Calculator,
  Briefcase
} from 'lucide-react';
import { SEO } from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';
import { usePurchases, TransactionRecord } from '../contexts/PurchaseContext';
import { SHOP_PRODUCTS } from '../data/shopProducts';
import {
  Appointment,
  CHAMBER_ADDRESS,
  CHAMBER_HOTLINE,
  DEFAULT_MEET_LINK,
  downloadIcsFile,
  getGoogleCalendarUrl,
  isAppointmentPast,
  subscribeToUserAppointments
} from '../services/appointmentService';
import {
  ClientDocument,
  downloadClientDocumentPDF,
  fetchClientDocuments
} from '../services/clientDocumentService';
import { DocumentViewerModal } from '../components/portal/DocumentViewerModal';
import { UploadDocumentModal } from '../components/portal/UploadDocumentModal';

type AppointmentFilter = 'all' | 'upcoming' | 'completed' | 'cancelled';
type DocumentCategoryFilter = 'All' | ClientDocument['category'];
type ServiceCategoryFilter = 'All' | 'Tax' | 'VAT' | 'Corporate';

interface ComplianceServiceQuickLink {
  id: string;
  title: string;
  statute: string;
  category: Exclude<ServiceCategoryFilter, 'All'>;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const COMPLIANCE_SERVICES: ComplianceServiceQuickLink[] = [
  {
    id: 'srv-income-tax',
    title: 'Income Tax Return & Computation',
    statute: 'Income Tax Act 2023 · AY 2026-27',
    category: 'Tax',
    path: '/tax-calculator',
    icon: Calculator
  },
  {
    id: 'srv-corporate-tax',
    title: 'Corporate Tax Planning Desk',
    statute: 'Finance Act 2026 · Corporate Rates',
    category: 'Tax',
    path: '/corporate-planner',
    icon: Briefcase
  },
  {
    id: 'srv-tds-sro',
    title: 'TDS & Withholding Tax Schedule',
    statute: 'SRO & Statutory Deduction Rates',
    category: 'Tax',
    path: '/SRO/TDS2026',
    icon: FileText
  },
  {
    id: 'srv-vat-calc',
    title: 'VAT & Mushak 9.1 Filing Desk',
    statute: 'VAT & SD Act 2012 · Monthly Returns',
    category: 'VAT',
    path: '/tools/vat',
    icon: Scale
  },
  {
    id: 'srv-vat-apportionment',
    title: 'VAT Apportionment & Rebate Tool',
    statute: 'Section 46 Input Tax Credit',
    category: 'VAT',
    path: '/tools/vat-apportionment-calculator',
    icon: Calculator
  },
  {
    id: 'srv-rjsc-returns',
    title: 'RJSC Annual Returns & Secretarial',
    statute: 'Companies Act 1994 · Schedule X & XII',
    category: 'Corporate',
    path: '/tools/rjsc-returns-filing-guide',
    icon: Building2
  },
  {
    id: 'srv-post-reg',
    title: 'Post-Registration Compliance Checklist',
    statute: 'e-TIN · BIN · Trade License · BIDA',
    category: 'Corporate',
    path: '/tools/post-registration-checklist',
    icon: ShieldCheck
  },
  {
    id: 'srv-dvc-verify',
    title: 'ICAB DVC Audit Verification',
    statute: 'Statutory Financial Statement Attestation',
    category: 'Corporate',
    path: '/tools/dvc-verification',
    icon: CheckCircle2
  },
  {
    id: 'srv-regulatory-library',
    title: 'Regulatory & SRO Document Library',
    statute: 'NBR Circulars · Statutory Forms',
    category: 'Corporate',
    path: '/resource-library',
    icon: BookOpen
  }
];

const DOCUMENT_CATEGORIES: DocumentCategoryFilter[] = [
  'All',
  'Tax Filings & NBR',
  'Legal Deeds & Contracts',
  'VAT & Customs',
  'Assurance & Audit',
  'Advisory Memos'
];

function getAppointmentBucket(apt: Appointment): 'upcoming' | 'completed' | 'cancelled' {
  if (apt.status === 'Cancelled') return 'cancelled';
  if (apt.status === 'Completed' || isAppointmentPast(apt)) return 'completed';
  return 'upcoming';
}

function formatReadableDate(dateStr?: string): string {
  if (!dateStr) return 'TBD';
  const parsed = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function resolveProductLink(tx: TransactionRecord): string {
  const matched = SHOP_PRODUCTS.find(
    (p) =>
      p.id === tx.productId ||
      p.slug === tx.productSlug ||
      p.slug === tx.productId ||
      p.title.toLowerCase() === tx.productTitle.toLowerCase()
  );
  if (matched?.coursePath) return matched.coursePath;
  if (matched?.slug) return `/product/${matched.slug}`;
  if (tx.productSlug) return `/product/${tx.productSlug}`;
  return '/portal?tab=payments';
}

function getAppointmentStatusTone(apt: Appointment): {
  label: string;
  textClass: string;
  icon: React.ComponentType<{ className?: string }>;
} {
  const bucket = getAppointmentBucket(apt);
  if (bucket === 'cancelled') {
    return { label: 'Cancelled', textClass: 'text-rose-700', icon: XCircle };
  }
  if (bucket === 'completed') {
    return { label: 'Completed', textClass: 'text-slate-600', icon: CheckCircle2 };
  }
  if (apt.status === 'Pending') {
    return { label: 'Pending confirmation', textClass: 'text-amber-700', icon: Clock };
  }
  return { label: 'Confirmed', textClass: 'text-emerald-700', icon: CheckCircle2 };
}

function getDocumentStatusTone(status: ClientDocument['status']): string {
  switch (status) {
    case 'Certified':
      return 'text-emerald-700';
    case 'Filed':
      return 'text-teal-700';
    case 'Ready for Signature':
      return 'text-blue-700';
    case 'Client Review Required':
      return 'text-amber-700';
    case 'Chamber Scoping':
      return 'text-slate-700';
    default:
      return 'text-slate-600';
  }
}

export function ClientDashboardPage() {
  const { user, authUser, loading: authLoading, signInWithGoogle } = useAuth();
  const { transactions, downloadReceipt } = usePurchases();

  const activeUser = useMemo(() => {
    if (user) {
      const email = user.email || user.providerData?.[0]?.email || authUser?.email || '';
      return {
        uid: user.uid,
        email,
        displayName: user.displayName || authUser?.displayName || email.split('@')[0] || 'Client Account',
        photoURL: user.photoURL || authUser?.photoURL || null
      };
    }
    if (authUser) {
      return {
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName || authUser.email.split('@')[0] || 'Client Account',
        photoURL: authUser.photoURL || null
      };
    }
    return null;
  }, [user, authUser]);

  // Sign-in gate state
  const [signInBusy, setSignInBusy] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Appointments state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentFilter, setAppointmentFilter] = useState<AppointmentFilter>('all');
  const [appointmentQuery, setAppointmentQuery] = useState('');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Documents state
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [docCategory, setDocCategory] = useState<DocumentCategoryFilter>('All');
  const [docQuery, setDocQuery] = useState('');
  const [linkedConsultationRef, setLinkedConsultationRef] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<ClientDocument | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Compliance services filter state
  const [serviceCategory, setServiceCategory] = useState<ServiceCategoryFilter>('All');

  // Subscribe to appointments for authenticated user
  useEffect(() => {
    if (!activeUser) {
      setAppointments([]);
      setAppointmentsLoading(false);
      return;
    }

    setAppointmentsLoading(true);
    const unsubscribe = subscribeToUserAppointments(
      activeUser.uid,
      activeUser.email,
      (list) => {
        setAppointments(list);
        setAppointmentsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeUser]);

  // Load legal documents for authenticated user
  const loadDocuments = useCallback(async () => {
    if (!activeUser) {
      setDocuments([]);
      setDocumentsLoading(false);
      return;
    }

    setDocumentsLoading(true);
    setDocumentsError(null);
    try {
      const list = await fetchClientDocuments(
        activeUser.uid,
        activeUser.displayName,
        activeUser.email
      );
      setDocuments(list);
    } catch {
      setDocumentsError('Unable to load your legal documents right now. Please retry.');
    } finally {
      setDocumentsLoading(false);
    }
  }, [activeUser]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Derived appointment metrics & lists
  const appointmentMetrics = useMemo(() => {
    let upcoming = 0;
    let completed = 0;
    let cancelled = 0;

    for (const apt of appointments) {
      const bucket = getAppointmentBucket(apt);
      if (bucket === 'upcoming') upcoming += 1;
      else if (bucket === 'completed') completed += 1;
      else cancelled += 1;
    }

    const upcomingSorted = appointments
      .filter((a) => getAppointmentBucket(a) === 'upcoming')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      total: appointments.length,
      upcoming,
      completed,
      cancelled,
      nextUpcoming: upcomingSorted[0] || null
    };
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    const q = appointmentQuery.trim().toLowerCase();
    return appointments.filter((apt) => {
      const bucket = getAppointmentBucket(apt);
      if (appointmentFilter !== 'all' && bucket !== appointmentFilter) {
        return false;
      }
      if (!q) return true;
      return (
        apt.referenceId.toLowerCase().includes(q) ||
        apt.practiceArea.toLowerCase().includes(q) ||
        (apt.division || '').toLowerCase().includes(q) ||
        (apt.notes || '').toLowerCase().includes(q)
      );
    });
  }, [appointments, appointmentFilter, appointmentQuery]);

  // Map document count per appointment reference
  const docCountByRef = useMemo(() => {
    const map = new Map<string, number>();
    for (const docItem of documents) {
      if (docItem.consultationRef) {
        map.set(docItem.consultationRef, (map.get(docItem.consultationRef) || 0) + 1);
      }
    }
    return map;
  }, [documents]);

  // Derived document metrics & filtered list
  const documentMetrics = useMemo(() => {
    const certifiedOrFiled = documents.filter(
      (d) => d.status === 'Certified' || d.status === 'Filed'
    ).length;
    const actionRequired = documents.filter(
      (d) => d.status === 'Ready for Signature' || d.status === 'Client Review Required'
    ).length;
    return {
      total: documents.length,
      certifiedOrFiled,
      actionRequired
    };
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const q = docQuery.trim().toLowerCase();
    return documents.filter((docItem) => {
      if (linkedConsultationRef && docItem.consultationRef !== linkedConsultationRef) {
        return false;
      }
      if (docCategory !== 'All' && docItem.category !== docCategory) {
        return false;
      }
      if (!q) return true;
      return (
        docItem.title.toLowerCase().includes(q) ||
        (docItem.subtitle || '').toLowerCase().includes(q) ||
        docItem.summary.toLowerCase().includes(q) ||
        (docItem.verificationCode || '').toLowerCase().includes(q) ||
        (docItem.consultationRef || '').toLowerCase().includes(q) ||
        docItem.category.toLowerCase().includes(q)
      );
    });
  }, [documents, linkedConsultationRef, docCategory, docQuery]);

  // Active purchased compliance products / retainers
  const activePurchasedServices = useMemo(() => {
    if (!activeUser) return [];
    return transactions.filter(
      (tx) => tx.status === 'completed' && tx.accessStatus === 'active'
    );
  }, [activeUser, transactions]);

  const pendingPurchasedServices = useMemo(() => {
    if (!activeUser) return [];
    return transactions.filter((tx) => tx.status === 'pending');
  }, [activeUser, transactions]);

  const filteredComplianceServices = useMemo(() => {
    if (serviceCategory === 'All') return COMPLIANCE_SERVICES;
    return COMPLIANCE_SERVICES.filter((srv) => srv.category === serviceCategory);
  }, [serviceCategory]);

  const totalActiveServicesCount = activePurchasedServices.length + COMPLIANCE_SERVICES.length;

  const handleCopyRef = (refId: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(refId).catch(() => {});
      setCopiedRef(refId);
      window.setTimeout(() => {
        setCopiedRef((prev) => (prev === refId ? null : prev));
      }, 2000);
    }
  };

  const handleGoogleSignIn = async () => {
    setSignInBusy(true);
    setSignInError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setSignInError(err?.message || 'Sign-in could not be completed. Please try again.');
    } finally {
      setSignInBusy(false);
    }
  };

  const handleDocumentUploaded = (newDoc: ClientDocument) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  // Loading state while auth session initializes
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SEO
          title="Client Dashboard"
          description="Access your booked legal and tax appointments, previous legal documents, and active compliance services."
          canonicalUrl="/client-dashboard"
          noindex
          type="webapp"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="h-3.5 w-36 bg-slate-200 rounded" />
              <div className="h-8 w-56 bg-slate-200 rounded" />
              <div className="h-4 w-72 bg-slate-200 rounded" />
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-36 bg-slate-200 rounded-lg" />
              <div className="h-10 w-40 bg-slate-200 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-5 space-y-2">
                <div className="h-3.5 w-28 bg-slate-200 rounded" />
                <div className="h-7 w-14 bg-slate-200 rounded" />
                <div className="h-3 w-36 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <div className="h-80 bg-white border border-slate-200 rounded-xl" />
              <div className="h-96 bg-white border border-slate-200 rounded-xl" />
            </div>
            <div className="lg:col-span-4 space-y-8">
              <div className="h-96 bg-white border border-slate-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated gate
  if (!activeUser) {
    return (
      <div className="min-h-screen bg-slate-50 py-14 px-4 sm:px-6 lg:px-8">
        <SEO
          title="Client Dashboard — Sign In"
          description="Sign in to view your booked consultations, previous legal documents, and active compliance services."
          canonicalUrl="/client-dashboard"
          noindex
          type="webapp"
        />
        <div className="max-w-xl mx-auto">
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-slate-500">
            <Link to="/" className="hover:text-slate-900 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-700 font-medium">Client Dashboard</span>
          </nav>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 sm:px-8 pt-8 pb-6 border-b border-slate-200">
              <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-emerald-700 mb-3">
                <Lock className="w-3.5 h-3.5" />
                <span>Authenticated Client Access</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Sign in to your Client Dashboard
              </h1>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Access your booked consultations, download certified legal and tax documents, and open your active compliance services in one workspace.
              </p>
            </div>

            <div className="px-6 sm:px-8 py-6 space-y-5">
              {signInError && (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{signInError}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={signInBusy}
                  className="flex-1 inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{signInBusy ? 'Signing in...' : 'Continue with Google'}</span>
                </button>
                <Link
                  to="/auth"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-medium transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Email Sign In</span>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </Link>
              </div>

              <div className="pt-4 border-t border-slate-200 divide-y divide-slate-100 text-sm">
                <div className="py-3 flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Booked Appointments Summary</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Track upcoming virtual and chamber sessions, join Google Meet links, and export calendar invites.
                    </p>
                  </div>
                </div>
                <div className="py-3 flex items-start gap-3">
                  <FileText className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Previous Legal Documents</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Review assessment orders, RJSC filings, writ drafts, and certified PDF dockets with verification codes.
                    </p>
                  </div>
                </div>
                <div className="py-3 flex items-start gap-3">
                  <Briefcase className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Active Compliance Services</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Direct links to unlocked compliance toolkits, tax computation desks, VAT filings, and RJSC checklists.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title="Client Dashboard"
        description="Summary of your booked legal and tax appointments, previous legal documents, and active compliance services."
        canonicalUrl="/client-dashboard"
        noindex
        type="webapp"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Workspace Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-xs text-slate-500">
              <Link to="/" className="hover:text-slate-900 transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-700 font-medium">Client Dashboard</span>
            </nav>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              Client Dashboard
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 truncate">
              <span className="font-medium text-slate-900">{activeUser.displayName}</span>
              {activeUser.email && (
                <>
                  <span className="mx-2 text-slate-300">·</span>
                  <span>{activeUser.email}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-600" />
              <span>Upload Document</span>
            </button>
            <Link
              to="/contact?tab=appointment"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Book Appointment</span>
            </Link>
          </div>
        </header>

        {/* 4-Metric Summary Strip */}
        <section
          aria-label="Account summary metrics"
          className="bg-white border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200"
        >
          <div className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Upcoming Appointments
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
              {appointmentsLoading ? '—' : appointmentMetrics.upcoming}
            </p>
            <p className="mt-1 text-xs text-slate-600 truncate tabular-nums">
              {appointmentMetrics.nextUpcoming
                ? `Next: ${formatReadableDate(appointmentMetrics.nextUpcoming.date)} · ${appointmentMetrics.nextUpcoming.timeSlot.split(' - ')[0]}`
                : 'No upcoming sessions scheduled'}
            </p>
          </div>

          <div className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Completed Consultations
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
              {appointmentsLoading ? '—' : appointmentMetrics.completed}
            </p>
            <p className="mt-1 text-xs text-slate-600 tabular-nums">
              {appointmentMetrics.total} total booked · {appointmentMetrics.cancelled} cancelled
            </p>
          </div>

          <div className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Legal Documents
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
              {documentsLoading ? '—' : documentMetrics.total}
            </p>
            <p className="mt-1 text-xs text-slate-600 tabular-nums">
              {documentMetrics.certifiedOrFiled} certified or filed
              {documentMetrics.actionRequired > 0 ? ` · ${documentMetrics.actionRequired} awaiting review` : ''}
            </p>
          </div>

          <div className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Active Compliance Services
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
              {totalActiveServicesCount}
            </p>
            <p className="mt-1 text-xs text-slate-600 tabular-nums">
              {activePurchasedServices.length} unlocked toolkits · {COMPLIANCE_SERVICES.length} statutory desks
            </p>
          </div>
        </section>

        {/* Main 12-Column Split Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Primary Column: Appointments & Legal Documents */}
          <div className="lg:col-span-8 space-y-8 min-w-0">
            {/* Booked Appointments Summary Section */}
            <section
              aria-labelledby="appointments-heading"
              className="bg-white border border-slate-200 rounded-xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 id="appointments-heading" className="text-base font-semibold text-slate-900">
                    Booked Appointments
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                    {appointmentMetrics.total} consultations across Accounticca Advisory and E-Lawyers Chambers
                  </p>
                </div>
                <Link
                  to="/portal"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 whitespace-nowrap shrink-0"
                >
                  <span>Full schedule &amp; reviews</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Next Upcoming Consultation Highlight Strip */}
              {!appointmentsLoading && appointmentMetrics.nextUpcoming && (
                <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wider text-emerald-700">
                        Next Upcoming Consultation
                      </p>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {appointmentMetrics.nextUpcoming.practiceArea}
                      </h3>
                      <p className="text-xs text-slate-600 tabular-nums flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {formatReadableDate(appointmentMetrics.nextUpcoming.date)}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span>{appointmentMetrics.nextUpcoming.timeSlot}</span>
                        <span className="text-slate-300">·</span>
                        <span className="inline-flex items-center gap-1">
                          {appointmentMetrics.nextUpcoming.mode === 'virtual' ? (
                            <>
                              <Video className="w-3.5 h-3.5 text-slate-500" />
                              Virtual (Google Meet)
                            </>
                          ) : (
                            <>
                              <MapPin className="w-3.5 h-3.5 text-slate-500" />
                              Panthapath Chamber, Dhaka
                            </>
                          )}
                        </span>
                      </p>
                      <div className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <button
                          type="button"
                          onClick={() => handleCopyRef(appointmentMetrics.nextUpcoming!.referenceId)}
                          className="inline-flex items-center gap-1 font-mono text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
                          title="Copy appointment reference"
                        >
                          <span>Ref {appointmentMetrics.nextUpcoming.referenceId}</span>
                          {copiedRef === appointmentMetrics.nextUpcoming.referenceId ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                        {appointmentMetrics.nextUpcoming.division && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span>{appointmentMetrics.nextUpcoming.division}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {appointmentMetrics.nextUpcoming.mode === 'virtual' ? (
                        <a
                          href={appointmentMetrics.nextUpcoming.meetingLink || DEFAULT_MEET_LINK}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Meet</span>
                        </a>
                      ) : (
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(
                            appointmentMetrics.nextUpcoming.chamberLocation || CHAMBER_ADDRESS
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Directions</span>
                        </a>
                      )}
                      <a
                        href={getGoogleCalendarUrl(appointmentMetrics.nextUpcoming)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                        <span>Google Cal</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => downloadIcsFile(appointmentMetrics.nextUpcoming!)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span>.ics</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Appointments Filter & Search Bar */}
              <div className="px-6 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1 overflow-x-auto">
                  {(
                    [
                      { key: 'all', label: 'All', count: appointmentMetrics.total },
                      { key: 'upcoming', label: 'Upcoming', count: appointmentMetrics.upcoming },
                      { key: 'completed', label: 'Completed', count: appointmentMetrics.completed },
                      { key: 'cancelled', label: 'Cancelled', count: appointmentMetrics.cancelled }
                    ] as const
                  ).map((tab) => {
                    const active = appointmentFilter === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setAppointmentFilter(tab.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 tabular-nums cursor-pointer ${
                          active
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {tab.label} ({tab.count})
                      </button>
                    );
                  })}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={appointmentQuery}
                    onChange={(e) => setAppointmentQuery(e.target.value)}
                    placeholder="Filter by reference or area..."
                    aria-label="Filter appointments"
                    className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                  {appointmentQuery && (
                    <button
                      type="button"
                      onClick={() => setAppointmentQuery('')}
                      aria-label="Clear appointment search"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Appointments List Body */}
              {appointmentsLoading ? (
                <div className="divide-y divide-slate-200 animate-pulse">
                  {[1, 2, 3].map((row) => (
                    <div key={row} className="px-6 py-4 flex items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-56 bg-slate-200 rounded" />
                        <div className="h-3 w-72 bg-slate-100 rounded" />
                      </div>
                      <div className="h-4 w-20 bg-slate-200 rounded" />
                    </div>
                  ))}
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-900">
                    {appointments.length === 0
                      ? 'No consultations booked yet'
                      : 'No appointments match your current filter'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                    {appointments.length === 0
                      ? 'Schedule a virtual or Dhaka chamber session with our tax, VAT, or corporate law partners.'
                      : 'Try switching status tabs or clearing your search query.'}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    {appointments.length === 0 ? (
                      <Link
                        to="/contact?tab=appointment"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Book Appointment</span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAppointmentFilter('all');
                          setAppointmentQuery('');
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-slate-200">
                  {filteredAppointments.map((apt) => {
                    const statusMeta = getAppointmentStatusTone(apt);
                    const StatusIcon = statusMeta.icon;
                    const linkedDocs = docCountByRef.get(apt.referenceId) || 0;
                    const bucket = getAppointmentBucket(apt);

                    return (
                      <li
                        key={apt.id || apt.referenceId}
                        className="px-6 py-4 hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                              <h3 className="text-sm font-medium text-slate-900">
                                {apt.practiceArea}
                              </h3>
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-medium ${statusMeta.textClass}`}
                              >
                                <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                                <span>{statusMeta.label}</span>
                              </span>
                            </div>

                            <p className="text-xs text-slate-500 tabular-nums flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span className="font-medium text-slate-700">
                                {formatReadableDate(apt.date)}
                              </span>
                              <span className="text-slate-300">·</span>
                              <span>{apt.timeSlot}</span>
                              <span className="text-slate-300">·</span>
                              <span>
                                {apt.mode === 'virtual' ? 'Google Meet' : 'Panthapath Chamber'}
                              </span>
                              <span className="text-slate-300">·</span>
                              <span className="font-mono text-slate-600">{apt.referenceId}</span>
                            </p>

                            {apt.notes && (
                              <p className="text-xs text-slate-600 line-clamp-1 pt-0.5">
                                {apt.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {linkedDocs > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setLinkedConsultationRef(apt.referenceId);
                                  setDocCategory('All');
                                  const docsEl = document.getElementById('legal-documents-section');
                                  docsEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                {linkedDocs} {linkedDocs === 1 ? 'document' : 'documents'}
                              </button>
                            )}

                            {bucket === 'upcoming' && (
                              <button
                                type="button"
                                onClick={() => downloadIcsFile(apt)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
                                title="Download calendar invite"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>.ics</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Previous Legal Documents Section */}
            <section
              id="legal-documents-section"
              aria-labelledby="documents-heading"
              className="bg-white border border-slate-200 rounded-xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 id="documents-heading" className="text-base font-semibold text-slate-900">
                    Previous Legal Documents
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Certified tax assessments, legal deeds, VAT reconciliations, and partner memos
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload document</span>
                </button>
              </div>

              {linkedConsultationRef && (
                <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-700">
                    Showing documents linked to appointment{' '}
                    <span className="font-mono font-medium text-slate-900">
                      {linkedConsultationRef}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setLinkedConsultationRef(null)}
                    className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Show all documents</span>
                  </button>
                </div>
              )}

              {/* Documents Search & Category Filter */}
              <div className="px-6 py-3 border-b border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={docQuery}
                      onChange={(e) => setDocQuery(e.target.value)}
                      placeholder="Search by document title, verification code, or reference..."
                      aria-label="Search legal documents"
                      className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                    />
                    {docQuery && (
                      <button
                        type="button"
                        onClick={() => setDocQuery('')}
                        aria-label="Clear document search"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 tabular-nums">
                    Showing {filteredDocuments.length} of {documents.length} files
                  </span>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                  {DOCUMENT_CATEGORIES.map((cat) => {
                    const active = docCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setDocCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Documents List Body */}
              {documentsError ? (
                <div className="px-6 py-10 text-center space-y-3">
                  <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
                  <p className="text-sm text-slate-800">{documentsError}</p>
                  <button
                    type="button"
                    onClick={loadDocuments}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry</span>
                  </button>
                </div>
              ) : documentsLoading ? (
                <div className="divide-y divide-slate-200 animate-pulse">
                  {[1, 2, 3, 4].map((row) => (
                    <div key={row} className="px-6 py-4 flex items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-72 bg-slate-200 rounded" />
                        <div className="h-3 w-96 bg-slate-100 rounded" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 w-20 bg-slate-100 rounded-lg" />
                        <div className="h-8 w-24 bg-slate-100 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <FolderOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-900">
                    {documents.length === 0
                      ? 'No legal documents in your archive yet'
                      : 'No documents match your filter criteria'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                    {documents.length === 0
                      ? 'Upload contracts, assessment orders, or bank statements to share securely with your chamber partner.'
                      : 'Adjust your category selection or clear your search term to view all files.'}
                  </p>
                  <div className="mt-4">
                    {documents.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => setUploadModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Document</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setDocCategory('All');
                          setDocQuery('');
                          setLinkedConsultationRef(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-slate-200">
                  {filteredDocuments.map((docItem) => (
                    <li
                      key={docItem.id}
                      className="px-6 py-4 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-start gap-2.5">
                            <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => setSelectedDocument(docItem)}
                                className="text-left text-sm font-medium text-slate-900 hover:text-emerald-700 transition-colors cursor-pointer"
                              >
                                {docItem.title}
                              </button>
                              <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                                {docItem.subtitle || docItem.summary}
                              </p>
                            </div>
                          </div>

                          <div className="pl-6.5 text-xs text-slate-500 tabular-nums flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className={`font-medium ${getDocumentStatusTone(docItem.status)}`}>
                              {docItem.status}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span>{docItem.category}</span>
                            <span className="text-slate-300">·</span>
                            <span className="uppercase">
                              {docItem.fileType} {docItem.fileSize}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span>{formatReadableDate(docItem.sharedDate)}</span>
                            {docItem.verificationCode && (
                              <>
                                <span className="text-slate-300">·</span>
                                <span className="font-mono text-slate-600">
                                  {docItem.verificationCode}
                                </span>
                              </>
                            )}
                            {docItem.consultationRef && (
                              <>
                                <span className="text-slate-300">·</span>
                                <span className="font-mono text-slate-600">
                                  Ref {docItem.consultationRef}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pl-6.5 sm:pl-0 shrink-0">
                          <button
                            type="button"
                            onClick={() => setSelectedDocument(docItem)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Preview</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadClientDocumentPDF(docItem)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-700" />
                            <span>PDF</span>
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Right Sidebar Column: Active Compliance Services & Quick Desk Links */}
          <aside className="lg:col-span-4 space-y-8 min-w-0">
            {/* Active Compliance Services Quick-Link List */}
            <section
              aria-labelledby="compliance-services-heading"
              className="bg-white border border-slate-200 rounded-xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-slate-200">
                <h2
                  id="compliance-services-heading"
                  className="text-base font-semibold text-slate-900"
                >
                  Active Compliance Services
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quick links to your unlocked toolkits and statutory compliance desks
                </p>
              </div>

              {/* Unlocked Purchased Toolkits / Retainers (when present) */}
              {(activePurchasedServices.length > 0 || pendingPurchasedServices.length > 0) && (
                <div className="border-b border-slate-200">
                  <div className="px-5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Unlocked Toolkits &amp; Retainers
                    </span>
                    <span className="text-xs text-slate-500 tabular-nums">
                      {activePurchasedServices.length} active
                    </span>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {activePurchasedServices.map((tx) => (
                      <li
                        key={tx.purchaseId || tx.id}
                        className="px-5 py-3 flex items-start justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="min-w-0">
                          <Link
                            to={resolveProductLink(tx)}
                            className="text-sm font-medium text-slate-900 hover:text-emerald-700 transition-colors line-clamp-1"
                          >
                            {tx.productTitle}
                          </Link>
                          <p className="text-xs text-slate-500 tabular-nums mt-0.5">
                            <span className="text-emerald-700 font-medium">Active</span>
                            <span className="mx-1.5 text-slate-300">·</span>
                            <span>{formatReadableDate(tx.purchaseDate)}</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => downloadReceipt(tx)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0 mt-0.5 cursor-pointer"
                          title="Download payment receipt"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                      </li>
                    ))}
                    {pendingPurchasedServices.map((tx) => (
                      <li
                        key={tx.purchaseId || tx.id}
                        className="px-5 py-3 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <Link
                            to="/portal?tab=payments"
                            className="text-sm font-medium text-slate-800 hover:text-emerald-700 line-clamp-1"
                          >
                            {tx.productTitle}
                          </Link>
                          <p className="text-xs text-amber-700 mt-0.5">
                            Pending payment verification
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Statutory Compliance Quick-Links Filter */}
              <div className="px-5 py-2.5 border-b border-slate-200 flex items-center gap-1 overflow-x-auto">
                {(['All', 'Tax', 'VAT', 'Corporate'] as const).map((cat) => {
                  const active = serviceCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setServiceCategory(cat)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Quick-Link List */}
              <ul className="divide-y divide-slate-100">
                {filteredComplianceServices.map((service) => {
                  const ServiceIcon = service.icon;
                  return (
                    <li key={service.id}>
                      <Link
                        to={service.path}
                        className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <ServiceIcon className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 shrink-0 mt-0.5 transition-colors" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                              {service.title}
                            </p>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {service.statute}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 shrink-0 transition-colors" />
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200">
                <Link
                  to="/tools"
                  className="inline-flex items-center justify-between w-full text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  <span>Explore all compliance tools &amp; calculators</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </section>

            {/* Related Workspace & Chamber Desk Navigation */}
            <section
              aria-labelledby="workspace-links-heading"
              className="bg-white border border-slate-200 rounded-xl overflow-hidden"
            >
              <div className="px-5 py-3.5 border-b border-slate-200">
                <h2
                  id="workspace-links-heading"
                  className="text-sm font-semibold text-slate-900"
                >
                  Workspace &amp; Chamber Desk
                </h2>
              </div>
              <ul className="divide-y divide-slate-100 text-sm">
                <li>
                  <Link
                    to="/portal"
                    className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-slate-900">Full Client Portal</p>
                      <p className="text-xs text-slate-500">Billing receipts, ratings &amp; vault</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard"
                    className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-slate-900">Compliance Deadlines &amp; Bookmarks</p>
                      <p className="text-xs text-slate-500">Saved guides &amp; filing calendar</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </Link>
                </li>
                <li>
                  <Link
                    to="/profile"
                    className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-slate-900">Profile &amp; Preferences</p>
                      <p className="text-xs text-slate-500">Account details &amp; notifications</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </Link>
                </li>
              </ul>
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-medium text-slate-800">Panthapath Chambers Desk</p>
                <p>{CHAMBER_ADDRESS}</p>
                <p className="tabular-nums text-slate-700 font-medium">{CHAMBER_HOTLINE}</p>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        document={selectedDocument}
        isOpen={Boolean(selectedDocument)}
        onClose={() => setSelectedDocument(null)}
      />

      {/* Upload Document Modal */}
      <UploadDocumentModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        userId={activeUser.uid}
        userName={activeUser.displayName}
        userEmail={activeUser.email}
        appointments={appointments}
        onDocumentUploaded={handleDocumentUploaded}
      />
    </div>
  );
}

export default ClientDashboardPage;
