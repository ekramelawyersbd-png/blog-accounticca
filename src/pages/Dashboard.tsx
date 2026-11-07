import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  BookMarked, 
  Bookmark, 
  PenSquare, 
  Bell, 
  BellRing, 
  Download, 
  Trash2,
  Search,
  Clock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Cloud,
  LogIn,
  RefreshCw,
  Check,
  Lock,
  LogOut,
  Copy,
  Printer,
  SlidersHorizontal,
  X,
  User,
  Briefcase,
  Calendar,
  ExternalLink,
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Activity,
  BarChart2,
  Settings,
  MessageSquarePlus,
  FileSpreadsheet,
  Trophy,
  GraduationCap
} from 'lucide-react';
import { ComplianceCalendar } from '../components/dashboard/ComplianceCalendar';
import { ComplianceChecklist } from '../components/dashboard/ComplianceChecklist';
import { ServiceWorkloadDonutChart } from '../components/dashboard/ServiceWorkloadDonutChart';
import { ClientActivityFeed } from '../components/dashboard/ClientActivityFeed';
import { InvoiceReminderManager } from '../components/dashboard/InvoiceReminderManager';
import { DailyGoalTracker } from '../components/dashboard/DailyGoalTracker';
import { GoalReminderToast } from '../components/dashboard/GoalReminderToast';
import { UserBadgesSection } from '../components/dashboard/UserBadgesSection';
import { SocialStreakShareWidget } from '../components/dashboard/SocialStreakShareWidget';
import { PurchaseHistorySection } from '../components/dashboard/PurchaseHistorySection';
import { UserProfile } from '../components/profile/UserProfile';
import { PaymentStatusWidget } from '../components/dashboard/PaymentStatusWidget';
import { QuickFeedbackWidget } from '../components/dashboard/QuickFeedbackWidget';
import ComplianceDeadlineReminder, { ApproachingComplianceToastBanner } from '../components/dashboard/ComplianceDeadlineReminder';
import { ComplianceDeadlinesCalendarView } from '../components/dashboard/ComplianceDeadlinesCalendarView';
import { ExportDataModal } from '../components/dashboard/ExportDataModal';
import { DashboardQuickActions } from '../components/dashboard/DashboardQuickActions';
import { WeeklyActivityTrendChart } from '../components/dashboard/WeeklyActivityTrendChart';
import { AnnualActivityHeatmap } from '../components/dashboard/AnnualActivityHeatmap';
import { FirebaseAnalyticsDashboard } from '../components/dashboard/FirebaseAnalyticsDashboard';
import { SEO } from '../components/SEO';
import { checkAndDispatchDeadlineNotifications } from '../services/smartNotificationService';
import { generateComplianceSummaryPDF } from '../utils/pdfGenerator';
import { Link, useSearchParams } from 'react-router-dom';
import { mockArticles } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { useBookmarks } from '../contexts/BookmarkContext';
import { usePurchases } from '../contexts/PurchaseContext';
import { useLms } from '../contexts/LmsContext';

type SortOption = 'recent' | 'title' | 'readTime';

export function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const sectionParam = searchParams.get('section');
  const { user, signInWithGoogle, logout } = useAuth();
  const { getFirstUncompletedLesson } = useLms();
  const continueLearningTarget = useMemo(
    () => getFirstUncompletedLesson(),
    [getFirstUncompletedLesson]
  );
  const { 
    savedItems, 
    removeBookmark, 
    clearAllBookmarks, 
    saveBookmark, 
    syncCloud, 
    isSyncing 
  } = useBookmarks();
  
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [profileSubTab, setProfileSubTab] = useState<
    'overview' | 'saved' | 'applications' | 'payments' | 'reminders' | 'activity' | 'achievements'
  >(() => {
    const target = sectionParam || tabParam;
    if (target === 'achievements' || target === 'badges') return 'achievements';
    if (target === 'activity') return 'activity';
    if (target === 'reminders' || target === 'invoices') return 'reminders';
    if (target === 'payments') return 'payments';
    if (target === 'saved' || target === 'bookmarks') return 'saved';
    if (target === 'applications') return 'applications';
    return 'overview';
  });
  const [activeTab, setActiveTab] = useState<'saved' | 'articles' | 'profile' | 'applications' | 'payments' | 'activity' | 'reminders' | 'analytics' | 'purchases' | 'feedback' | 'achievements' | 'deadlines'>(
    tabParam === 'deadlines' || tabParam === 'calendar' || tabParam === 'schedule'
      ? 'deadlines'
      : tabParam === 'analytics' || tabParam === 'firebase-analytics'
      ? 'analytics'
      : tabParam === 'feedback' || tabParam === 'rating' || tabParam === 'review'
      ? 'feedback'
      : tabParam === 'purchases' || tabParam === 'unlocked' || tabParam === 'history'
      ? 'purchases'
      : tabParam === 'articles'
      ? 'articles'
      : 'profile'
  );
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [confirmClear, setConfirmClear] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const { transactions } = usePurchases();

  // KPI Calculations for current month
  const totalRevenue = useMemo(() => {
    const sum = transactions
      .filter(t => t.status === 'completed')
      .reduce((acc, t) => acc + t.amount, 0);
    return sum > 0 ? sum + 75000 : 78500;
  }, [transactions]);

  const activeSubscriptions = useMemo(() => {
    return 12; // Active tax & corporate retainers
  }, []);

  const pendingInvoicesTotal = useMemo(() => {
    const sum = transactions
      .filter(t => t.status === 'pending')
      .reduce((acc, t) => acc + t.amount, 0);
    return sum > 0 ? sum : 12500;
  }, [transactions]);

  const pendingInvoicesCount = useMemo(() => {
    const count = transactions.filter(t => t.status === 'pending').length;
    return count > 0 ? count : 3;
  }, [transactions]);

  // My Applications & Interview Scheduler State
  const [myApplications] = useState([
    {
      id: 'app-1',
      jobTitle: 'Senior Corporate Tax Consultant',
      department: 'Tax Advisory',
      appliedDate: '2026-10-08',
      status: 'Interview Scheduled',
      interviewDate: '2026-10-25',
      interviewTime: '11:00 AM - 11:45 AM',
      mode: 'Google Meet (Online)',
      location: 'Google Meet Video Call'
    },
    {
      id: 'app-2',
      jobTitle: 'VAT Compliance Specialist',
      department: 'Legal & Compliance',
      appliedDate: '2026-10-05',
      status: 'Under Review',
      interviewDate: 'TBD',
      interviewTime: 'TBD',
      mode: 'In-Person',
      location: 'Gulshan Office, Dhaka'
    }
  ]);

  const handleSyncGoogleCalendar = (app: typeof myApplications[0]) => {
    const title = encodeURIComponent(`Interview: ${app.jobTitle} - E-Lawyers & Accounticca`);
    const details = encodeURIComponent(`Interview session for ${app.jobTitle} (${app.department}). Status: ${app.status}.`);
    const location = encodeURIComponent(app.location);
    
    const start = new Date(`${app.interviewDate !== 'TBD' ? app.interviewDate : '2026-10-25'}T11:00:00`);
    const end = new Date(start.getTime() + 45 * 60000);
    
    const formatGCalDate = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
    const dates = `${formatGCalDate(start)}/${formatGCalDate(end)}`;

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    const target = sectionParam || tabParam;
    if (tabParam === 'deadlines' || tabParam === 'calendar' || tabParam === 'schedule') {
      setActiveTab('deadlines');
    } else if (tabParam === 'analytics' || tabParam === 'firebase-analytics') {
      setActiveTab('analytics');
    } else if (tabParam === 'feedback' || tabParam === 'rating' || tabParam === 'review') {
      setActiveTab('feedback');
    } else if (tabParam === 'purchases' || tabParam === 'unlocked' || tabParam === 'history') {
      setActiveTab('purchases');
    } else if (tabParam === 'articles') {
      setActiveTab('articles');
    } else if (target === 'achievements' || target === 'badges') {
      setActiveTab('profile');
      setProfileSubTab('achievements');
    } else if (target === 'activity') {
      setActiveTab('profile');
      setProfileSubTab('activity');
    } else if (target === 'reminders' || target === 'invoices') {
      setActiveTab('profile');
      setProfileSubTab('reminders');
    } else if (target === 'payments') {
      setActiveTab('profile');
      setProfileSubTab('payments');
    } else if (target === 'saved' || target === 'bookmarks') {
      setActiveTab('profile');
      setProfileSubTab('saved');
    } else if (target === 'applications') {
      setActiveTab('profile');
      setProfileSubTab('applications');
    } else if (tabParam === 'profile' || tabParam === 'settings') {
      setActiveTab('profile');
      setProfileSubTab('overview');
    }
  }, [tabParam, sectionParam]);

  const switchProfileSubTab = (
    subTab: 'overview' | 'saved' | 'applications' | 'payments' | 'reminders' | 'activity' | 'achievements'
  ) => {
    setActiveTab('profile');
    setProfileSubTab(subTab);
    if (subTab === 'overview') {
      setSearchParams({ tab: 'profile' }, { preventScrollReset: true });
    } else {
      setSearchParams({ tab: 'profile', section: subTab }, { preventScrollReset: true });
    }
  };

  const switchTab = (tab: 'saved' | 'articles' | 'profile' | 'applications' | 'payments' | 'activity' | 'reminders' | 'analytics' | 'purchases' | 'feedback' | 'achievements' | 'deadlines') => {
    if (
      tab === 'achievements' ||
      tab === 'activity' ||
      tab === 'reminders' ||
      tab === 'payments' ||
      tab === 'saved' ||
      tab === 'applications'
    ) {
      switchProfileSubTab(tab as any);
      return;
    }
    setActiveTab(tab);
    if (tab === 'profile') {
      setProfileSubTab('overview');
    }
    setSearchParams({ tab }, { preventScrollReset: true });
  };

  const handleRemoveSaved = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    await removeBookmark(id);
  };

  const handleClearAll = async () => {
    await clearAllBookmarks();
    setConfirmClear(false);
  };

  const handleQuickBookmark = async (articleId: string) => {
    const article = mockArticles.find(a => a.id === articleId);
    if (article) {
      await saveBookmark({
        id: article.id,
        title: article.title,
        type: 'article',
        url: `/article/${article.id}`,
        dateSaved: new Date().toISOString(),
        offlineExcerpt: article.excerpt,
        offlineImageUrl: article.imageUrl,
        category: article.category,
        categoryId: article.categoryId,
        readTime: article.readTime,
        authorName: article.author?.name
      });
    }
  };

  const handleCopyLink = (id: string, url: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handlePrintReadingList = () => {
    window.print();
  };

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === 'granted') {
        checkAndDispatchDeadlineNotifications().catch(() => {});
      }
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notification');
      return;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const simulateAmendmentAlert = () => {
    if (notificationPermission === 'granted') {
      const notification = new Notification('Finance Act 2026 Amendment', {
        body: 'A new amendment affecting "Corporate Tax" (your saved category) has been published.',
        icon: '/vite.svg',
      });

      notification.onclick = function() {
        window.focus();
        this.close();
      };
    } else {
      alert('Please enable notifications first.');
    }
  };

  // Extract unique categories from saved items
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    savedItems.forEach(item => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats);
  }, [savedItems]);

  // Filter and sort items
  const filteredSavedItems = useMemo(() => {
    const filtered = savedItems.filter(item => {
      const query = searchFilter.trim().toLowerCase();
      const matchesSearch = !query || 
        item.title.toLowerCase().includes(query) ||
        (item.offlineExcerpt && item.offlineExcerpt.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query));
      
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCat;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.dateSaved).getTime() - new Date(a.dateSaved).getTime();
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'readTime') {
        return (a.readTime || 5) - (b.readTime || 5);
      }
      return 0;
    });
  }, [savedItems, searchFilter, selectedCategory, sortBy]);

  const recommendedGuides = useMemo(() => {
    return mockArticles.slice(0, 3);
  }, []);

  // Compute initials for user avatar
  const userInitials = useMemo(() => {
    if (!user) return 'GU';
    if (user.displayName) {
      return user.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
    }
    return user.email ? user.email.substring(0, 2).toUpperCase() : 'U';
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-20 flex flex-col md:flex-row items-start gap-8">
      <SEO
        title="Client & Compliance Dashboard – Deadlines, Bookmarks & Filings | Accounticca"
        description="Manage your statutory compliance calendar, saved tax scenarios, bookmarked legal guides, and filing reminders on your Accounticca Dashboard."
        canonicalUrl="/dashboard"
        type="webapp"
      />
      {/* Sidebar */}
      <aside className="w-full md:w-64 shrink-0 md:sticky md:top-24">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm mb-6">
          {/* User Profile Card */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || "User avatar"} 
                className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg shrink-0">
                {userInitials}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 truncate">
                {user ? user.displayName || user.email?.split('@')[0] : 'Guest User'}
              </h2>
              <p className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold flex items-center gap-1">
                {user ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Registered Member</span>
                  </>
                ) : (
                  <span>Offline Guest</span>
                )}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2 mb-6 text-left">
            <div className="space-y-1.5">
              <button 
                id="dashboard-tab-profile"
                onClick={() => switchProfileSubTab('overview')} 
                className={`w-full flex items-center justify-between text-left px-3.5 py-2.5 transition-colors rounded-xl font-bold text-sm cursor-pointer ${
                  activeTab === 'profile' 
                    ? 'bg-emerald-50 text-emerald-700 shadow-xs' 
                    : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                <div className="flex items-center justify-start gap-3 text-left min-w-0">
                  <User className="w-5 h-5 text-emerald-600 shrink-0" /> 
                  <span className="text-left leading-snug">Account Profile</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                  Hub
                </span>
              </button>

              {activeTab === 'profile' && (
                <div className="ml-4 pl-3 border-l-2 border-emerald-100 space-y-1 py-1">
                  {[
                    { id: 'overview', label: 'Account Settings', badge: null },
                    { id: 'saved', label: 'Saved Articles', badge: savedItems.length },
                    { id: 'applications', label: 'My Applications', badge: myApplications.length },
                    { id: 'payments', label: 'Payment Status', badge: null },
                    { id: 'reminders', label: 'Invoice Reminders', badge: pendingInvoicesCount },
                    { id: 'activity', label: 'Activity Feed', badge: null },
                    { id: 'achievements', label: 'Achievements & Badges', badge: null },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => switchProfileSubTab(item.id as any)}
                      className={`w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        profileSubTab === item.id
                          ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      {item.badge !== null && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                            profileSubTab === item.id
                              ? 'bg-emerald-800 text-emerald-100'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              id="dashboard-link-my-study"
              to="/student/dashboard"
              className="w-full flex items-center justify-between text-left px-3.5 py-2.5 transition-colors rounded-xl font-bold text-sm text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 cursor-pointer"
            >
              <div className="flex items-center justify-start gap-3 text-left min-w-0">
                <GraduationCap className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-left leading-snug">My study</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                LMS
              </span>
            </Link>

            <Link
              id="dashboard-continue-learning-btn"
              to={continueLearningTarget.routeUrl}
              title={`Resume at ${continueLearningTarget.className} in ${continueLearningTarget.courseTitle}`}
              className="w-full flex items-center justify-between text-left px-3.5 py-2.5 transition-colors rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
            >
              <div className="flex items-center justify-start gap-2.5 text-left min-w-0">
                <ArrowRight className="w-4 h-4 text-emerald-100 shrink-0" />
                <span className="text-left leading-snug truncate">Continue Learning</span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-800/80 text-emerald-100 font-bold px-2 py-0.5 rounded-full shrink-0">
                {continueLearningTarget.className}
              </span>
            </Link>

            <button 
              id="dashboard-tab-deadlines"
              onClick={() => switchTab('deadlines')} 
              className={`w-full flex items-center justify-between text-left px-3.5 py-2.5 transition-colors rounded-xl font-bold text-sm cursor-pointer ${
                activeTab === 'deadlines' 
                  ? 'bg-emerald-50 text-emerald-800 shadow-xs' 
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              <div className="flex items-center justify-start gap-3 text-left min-w-0">
                <Calendar className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-left leading-snug">Deadlines Calendar</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                Timeline
              </span>
            </button>

            <button 
              id="dashboard-tab-analytics"
              onClick={() => switchTab('analytics')} 
              className={`w-full flex items-center justify-between text-left px-3.5 py-2.5 transition-colors rounded-xl font-bold text-sm cursor-pointer ${
                activeTab === 'analytics' 
                  ? 'bg-emerald-50 text-emerald-800 shadow-xs' 
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              <div className="flex items-center justify-start gap-3 text-left min-w-0">
                <BarChart2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-left leading-snug">Content & Tool Analytics</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                GA4
              </span>
            </button>

            <button 
              id="dashboard-tab-feedback"
              onClick={() => switchTab('feedback')} 
              className={`w-full flex items-center justify-between text-left px-3.5 py-2.5 transition-colors rounded-xl font-bold text-sm cursor-pointer ${
                activeTab === 'feedback' 
                  ? 'bg-amber-50 text-amber-900 shadow-xs' 
                  : 'text-slate-600 hover:bg-amber-50 hover:text-amber-900'
              }`}
            >
              <div className="flex items-center justify-start gap-3 text-left min-w-0">
                <MessageSquarePlus className="w-5 h-5 text-amber-600 shrink-0" />
                <span className="text-left leading-snug">Quick Feedback</span>
              </div>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                Rate
              </span>
            </button>

            <div className="pt-2">
              {user ? (
                <button
                  id="dashboard-logout-btn"
                  onClick={logout}
                  className="w-full flex items-center justify-start gap-3 text-left px-3.5 py-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors rounded-xl font-semibold text-xs cursor-pointer"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span className="text-left">Sign Out</span>
                </button>
              ) : (
                <button
                  id="dashboard-signin-btn"
                  onClick={signInWithGoogle}
                  className="w-full flex items-center justify-start gap-3 text-left px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
                >
                  <LogIn className="w-4 h-4 shrink-0" />
                  <span className="text-left">Sign In with Google</span>
                </button>
              )}
            </div>
          </nav>
          
          <div className="border-t border-slate-100 pt-6 space-y-2.5">
            <button 
              id="download-summary-pdf-btn"
              onClick={generateComplianceSummaryPDF}
              className="w-full flex justify-center items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-sm transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Summary PDF
            </button>

            <button 
              id="export-dashboard-data-btn"
              onClick={() => setShowExportModal(true)}
              className="w-full flex justify-center items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-sm transition-colors cursor-pointer shadow-xs"
              title="Download your activity progress and stored compliance deadlines as a CSV file"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Export Data (CSV)</span>
            </button>
          </div>
        </div>

        <div className="bg-emerald-900 rounded-3xl border border-emerald-800 p-6 shadow-sm text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-800 p-2 rounded-xl">
              {notificationPermission === 'granted' ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
            </div>
            <h3 className="font-bold">Statutory Alerts</h3>
          </div>
          <p className="text-emerald-200 text-sm mb-4 leading-relaxed">
            Get notified instantly when amendments affect your saved legal categories and tax provisions.
          </p>
          
          {notificationPermission !== 'granted' ? (
            <button 
              id="enable-notifications-btn"
              onClick={requestNotificationPermission}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2 rounded-xl text-sm transition-colors cursor-pointer"
            >
              Enable Notifications
            </button>
          ) : (
            <button 
              id="simulate-alert-btn"
              onClick={simulateAmendmentAlert}
              className="w-full bg-emerald-800 border border-emerald-700 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-sm transition-colors cursor-pointer"
            >
              Test Alert Simulation
            </button>
          )}

          <div className="pt-3 mt-3 border-t border-emerald-800/80 flex items-center justify-between text-[11px]">
            <span className="text-emerald-300">Smart 3-Day Alerts</span>
            <button
              onClick={() => switchTab('profile')}
              className="font-bold text-amber-300 hover:text-amber-200 underline cursor-pointer"
            >
              Configure in Profile &rarr;
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 w-full space-y-8">
        {/* Dashboard Title & Quick Actions Header */}
        <div className="hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">Compliance & Advisory Dashboard</h1>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                FY 2026-27 Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitor daily statutory deadlines, study goals, tax calculators, and client filing workflows.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              id="header-export-data-csv-btn"
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
              title="Download your activity progress and stored compliance deadlines as a CSV file"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Export Data (CSV)</span>
            </button>
          </div>
        </div>

        {/* KPI Summary Row Cards (Current Month) */}
        <div className="hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</p>
              <p className="text-2xl font-extrabold text-slate-900">৳{totalRevenue.toLocaleString()}</p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <TrendingUp className="w-3 h-3" />
                <span>+18.4% vs last month</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Subscriptions</p>
              <p className="text-2xl font-extrabold text-slate-900">{activeSubscriptions} Retainers</p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600">
                <ShieldCheck className="w-3 h-3" />
                <span>Tax & Legal Advisory</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>

          <div 
            onClick={() => switchTab('reminders')}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between cursor-pointer hover:border-amber-300 hover:shadow-md transition-all group"
            title="Click to view approaching pending invoices and automated reminders"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Invoices</p>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 group-hover:bg-amber-100">
                  Auto-Remind
                </span>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">৳{pendingInvoicesTotal.toLocaleString()}</p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                <Clock className="w-3 h-3" />
                <span>{pendingInvoicesCount} Invoices awaiting clearance</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <BellRing className="w-6 h-6 text-amber-600" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed Filings</p>
              <p className="text-2xl font-extrabold text-slate-900">28 Filings</p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <Check className="w-3 h-3" />
                <span>Current Month (Oct 2026)</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div 
            id="kpi-next-tax-deadline-card"
            onClick={() => switchTab('deadlines')}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between sm:col-span-2 lg:col-span-1 cursor-pointer hover:border-rose-400 hover:shadow-md transition-all group"
            title="Click to view interactive compliance deadlines calendar"
          >
            <div className="space-y-1">
              <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Next Tax Deadline</p>
              <p className="text-xl font-extrabold text-slate-900 group-hover:text-rose-700 transition-colors">Nov 15, 2026</p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600">
                <AlertCircle className="w-3 h-3" />
                <span>Mushak 9.1 & VAT Retainer</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Quick links removed per user request */}

        {activeTab === 'deadlines' ? (
          <ComplianceDeadlinesCalendarView />
        ) : activeTab === 'analytics' ? (
          <FirebaseAnalyticsDashboard />
        ) : activeTab === 'purchases' ? (
          <PurchaseHistorySection />
        ) : activeTab === 'feedback' ? (
          <QuickFeedbackWidget />
        ) : (
          <div className="space-y-6">
            {/* Consolidated Account Profile Navigation Bar */}
            <div
              id="profile-consolidated-subnav"
              className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    Account Profile Hub
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  All personal settings, saved resources, billing & activity
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  id="profile-subtab-overview"
                  type="button"
                  onClick={() => switchProfileSubTab('overview')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    profileSubTab === 'overview'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Account Settings</span>
                </button>

                <button
                  id="profile-subtab-saved"
                  type="button"
                  onClick={() => switchProfileSubTab('saved')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    profileSubTab === 'saved'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Saved Articles</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      profileSubTab === 'saved'
                        ? 'bg-emerald-800 text-emerald-100'
                        : 'bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    {savedItems.length}
                  </span>
                </button>

                <button
                  id="profile-subtab-applications"
                  type="button"
                  onClick={() => switchProfileSubTab('applications')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    profileSubTab === 'applications'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>My Applications</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      profileSubTab === 'applications'
                        ? 'bg-emerald-800 text-emerald-100'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {myApplications.length}
                  </span>
                </button>

                <button
                  id="profile-subtab-payments"
                  type="button"
                  onClick={() => switchProfileSubTab('payments')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    profileSubTab === 'payments'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Payment Status</span>
                </button>

                <button
                  id="profile-subtab-reminders"
                  type="button"
                  onClick={() => switchProfileSubTab('reminders')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    profileSubTab === 'reminders'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>Invoice Reminders</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      profileSubTab === 'reminders'
                        ? 'bg-emerald-800 text-emerald-100'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {pendingInvoicesCount}
                  </span>
                </button>

                <button
                  id="profile-subtab-activity"
                  type="button"
                  onClick={() => switchProfileSubTab('activity')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    profileSubTab === 'activity'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Activity Feed</span>
                </button>



                <button
                  id="profile-subtab-achievements"
                  type="button"
                  onClick={() => switchProfileSubTab('achievements')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    profileSubTab === 'achievements'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Achievements & Badges</span>
                </button>
              </div>
            </div>

            {profileSubTab === 'overview' && activeTab !== 'articles' ? (
              <UserProfile />
            ) : profileSubTab === 'payments' ? (
              <PaymentStatusWidget onNavigateReminders={() => switchProfileSubTab('reminders')} />
            ) : profileSubTab === 'activity' ? (
              <ClientActivityFeed />
            ) : profileSubTab === 'reminders' ? (
              <InvoiceReminderManager onViewPayments={() => switchProfileSubTab('payments')} />
            ) : profileSubTab === 'achievements' ? (
              <UserBadgesSection />
            ) : (
              <div id="dashboard-main-card" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm min-h-[500px]">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 border-b border-slate-100 pb-6">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 id="dashboard-section-title" className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                  {profileSubTab === 'saved' ? (
                    <>
                      <BookMarked className="w-6 h-6 text-emerald-600" />
                      <span>Saved Articles & Reference Library</span>
                    </>
                  ) : profileSubTab === 'applications' ? (
                    <>
                      <Briefcase className="w-6 h-6 text-emerald-600" />
                      <span>My Applications & Interview Scheduler</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-6 h-6 text-emerald-600" />
                      <span>My Contributions</span>
                    </>
                  )}
                </h1>

                {profileSubTab === 'saved' && (
                  user ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Cloud Synced to Account</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                      <Lock className="w-3 h-3 text-slate-500" />
                      <span>Saved on Device</span>
                    </span>
                  )
                )}
              </div>

              <p className="text-sm text-slate-500 mt-1.5 max-w-2xl">
                {profileSubTab === 'saved' 
                  ? user 
                    ? `Your private repository of bookmarked statutory guides, tax analysis, and legal commentary linked to ${user.email}.`
                    : 'Statutory guides saved in this browser. Sign in to permanently sync your reading list to your account across all devices.'
                  : 'Manage and publish legal insights for the E-Lawyers community.'}
              </p>
            </div>

            {activeTab === 'articles' ? (
              <button 
                id="new-article-btn"
                className="bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-800 transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
              >
                <PenSquare className="w-4 h-4" /> New Article
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                {user && (
                  <button
                    id="sync-cloud-bookmarks-btn"
                    onClick={syncCloud}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                    title="Sync local bookmarks with cloud"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
                  </button>
                )}

                {savedItems.length > 0 && (
                  <button
                    onClick={handlePrintReadingList}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                    title="Print or export reading list"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Print List</span>
                  </button>
                )}

                {savedItems.length > 0 && (
                  confirmClear ? (
                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                      <span className="text-xs text-rose-700 font-semibold">Clear all?</span>
                      <button
                        id="confirm-clear-bookmarks-btn"
                        onClick={handleClearAll}
                        className="text-xs bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmClear(false)}
                        className="text-xs text-slate-600 hover:text-slate-800 px-1 font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      id="clear-all-bookmarks-btn"
                      onClick={() => setConfirmClear(true)}
                      className="text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors border border-slate-200 hover:border-rose-200 cursor-pointer"
                    >
                      Clear All
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* Guest Sign-in Callout if not logged in */}
          {profileSubTab === 'saved' && !user && (
            <div id="saved-items-auth-prompt" className="mb-6 bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0 mt-0.5 sm:mt-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Sign in to save articles permanently across all your devices</h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed max-w-xl">
                    You currently have {savedItems.length} article{savedItems.length === 1 ? '' : 's'} saved on this device. Sign in with Google to automatically backup your personal library to Firestore and access them anytime.
                  </p>
                </div>
              </div>
              <button
                onClick={signInWithGoogle}
                className="shrink-0 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs whitespace-nowrap"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In with Google</span>
              </button>
            </div>
          )}
          
          {profileSubTab === 'applications' ? (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Job Applications & Google Calendar API Sync</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    View active job applications and sync your confirmed interview slots directly to your personal Google Calendar.
                  </p>
                </div>
                <Link
                  to="/contact"
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-sm"
                >
                  Contact Practice Desk
                </Link>
              </div>

              <div className="space-y-4">
                {myApplications.map((app) => (
                  <div key={app.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
                          {app.department}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          app.status === 'Interview Scheduled' 
                            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900">{app.jobTitle}</h4>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                        <span>Applied on: {app.appliedDate}</span>
                        <span>•</span>
                        <span>Mode: {app.mode}</span>
                        {app.interviewDate !== 'TBD' && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 font-bold">Interview: {app.interviewDate} ({app.interviewTime})</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSyncGoogleCalendar(app)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
                        title="Sync interview slot to Google Calendar API"
                      >
                        <Calendar className="w-4 h-4 text-emerald-100" />
                        <span>Add to Google Calendar API</span>
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'articles' ? (
            <div id="my-articles-empty-state" className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No contributions yet</h3>
              <p className="text-slate-500 max-w-sm mb-6 text-sm">You haven't authored any legal commentary yet. Share your statutory analyses with our professional community.</p>
              <button className="text-emerald-700 font-bold hover:underline text-sm cursor-pointer">
                Submit an analysis for review &rarr;
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Filter, Search, and Sort Toolbar */}
              {savedItems.length > 0 && (
                <div id="bookmarks-toolbar" className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="bookmarks-search-input"
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder="Search saved articles by title, keywords, or legal issues..."
                        className="w-full pl-9 pr-8 py-2 bg-white text-xs sm:text-sm text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {searchFilter && (
                        <button
                          onClick={() => setSearchFilter('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                        <span className="hidden sm:inline">Sort:</span>
                      </div>
                      <select
                        id="bookmarks-sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="recent">Recently Saved</option>
                        <option value="title">Title (A–Z)</option>
                        <option value="readTime">Reading Time</option>
                      </select>
                    </div>
                  </div>

                  {/* Category Pills */}
                  {availableCategories.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 pt-1 border-t border-slate-200/60">
                      <button
                        id="cat-filter-all"
                        onClick={() => setSelectedCategory('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                          selectedCategory === 'all'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        All Categories ({savedItems.length})
                      </button>
                      {availableCategories.map((cat) => {
                        const count = savedItems.filter(i => i.category === cat).length;
                        return (
                          <button
                            key={cat}
                            id={`cat-filter-${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                              selectedCategory === cat
                                ? 'bg-emerald-700 text-white shadow-xs'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            {cat} ({count})
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Bookmarked items display */}
              {savedItems.length === 0 ? (
                /* Empty state with recommendations */
                <div id="bookmarks-empty-state" className="py-12 text-center">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                    <BookMarked className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No saved articles in your library yet</h3>
                  <p className="text-slate-500 max-w-md mx-auto text-sm mb-8 leading-relaxed">
                    Bookmark articles, statutory guidelines, and tax compliance reference manuals while reading. Click the bookmark icon on any guide to store it here in your personal dashboard for later reference.
                  </p>

                  <div className="border-t border-slate-100 pt-8 max-w-2xl mx-auto text-left">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">Recommended Legal Guides to Save</h4>
                    </div>
                    <div className="space-y-3">
                      {recommendedGuides.map((guide) => (
                        <div 
                          key={guide.id} 
                          id={`rec-guide-${guide.id}`}
                          className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 rounded-2xl transition-colors group"
                        >
                          <div className="min-w-0 pr-4">
                            <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 mb-1">
                              {guide.category}
                            </span>
                            <Link 
                              to={`/article/${guide.id}`} 
                              className="block font-bold text-slate-900 group-hover:text-emerald-700 transition-colors text-sm truncate"
                            >
                              {guide.title}
                            </Link>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              id={`bookmark-rec-btn-${guide.id}`}
                              onClick={() => handleQuickBookmark(guide.id)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-white hover:bg-emerald-700 hover:text-white border border-emerald-300 px-3 py-1.5 rounded-xl transition-colors cursor-pointer shadow-xs"
                            >
                              <Bookmark className="w-3.5 h-3.5" />
                              <span>Save to Dashboard</span>
                            </button>
                            <Link
                              to={`/article/${guide.id}`}
                              className="text-xs text-slate-500 hover:text-slate-900 p-1.5 transition-colors"
                              title="Read Guide"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : filteredSavedItems.length === 0 ? (
                /* Search filter gave 0 items */
                <div id="bookmarks-no-filter-results" className="text-center py-16">
                  <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">No saved articles match your search</h3>
                  <p className="text-sm text-slate-500 mb-4">Try checking for typos or reset your active filters.</p>
                  <button
                    onClick={() => {
                      setSearchFilter('');
                      setSelectedCategory('all');
                    }}
                    className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                /* Grid of saved items cards */
                <div id="bookmarks-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSavedItems.map((item) => (
                    <div 
                      key={item.id} 
                      id={`bookmarked-item-${item.id}`}
                      className="group bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 sm:p-5 transition-all shadow-xs hover:shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        {/* Top badge row */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800">
                            {item.category || (item.type === 'policy' ? 'Tax Policy' : 'Legal Guide')}
                          </span>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                            <Clock className="w-3 h-3" />
                            <span>{item.readTime ? `${item.readTime} min read` : '5 min read'}</span>
                          </div>
                        </div>

                        {/* Title */}
                        <Link 
                          to={item.url} 
                          className="block font-bold text-slate-900 hover:text-emerald-700 transition-colors text-base leading-snug mb-2 line-clamp-2"
                        >
                          {item.title}
                        </Link>

                        {/* Excerpt if available */}
                        {item.offlineExcerpt && (
                          <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                            {item.offlineExcerpt}
                          </p>
                        )}
                      </div>

                      {/* Bottom action row */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs mt-2">
                        <span className="text-slate-400 text-[11px]">
                          Saved {new Date(item.dateSaved).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <button
                            id={`copy-link-btn-${item.id}`}
                            onClick={(e) => handleCopyLink(item.id, item.url, e)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Copy link to article"
                            aria-label="Copy link to article"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button 
                            id={`remove-bookmark-btn-${item.id}`}
                            onClick={(e) => handleRemoveSaved(item.id, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove from Saved Articles"
                            aria-label="Remove saved article"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <Link 
                            to={item.url} 
                            className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <span>Read</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        )}
          </div>
        )}
      </main>

      {/* Export Data Modal */}
      <ExportDataModal 
        isOpen={showExportModal} 
        onClose={() => setShowExportModal(false)} 
      />
    </div>
  );
}
