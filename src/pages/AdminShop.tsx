import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Search, 
  RotateCcw, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  FileText, 
  DollarSign, 
  Tag, 
  Layers, 
  Eye, 
  EyeOff,
  ArrowLeft, 
  Copy, 
  AlertCircle,
  Image as ImageIcon,
  CheckCircle2,
  ListPlus,
  X,
  Scale,
  LogOut,
  Lock,
  Link2,
  FileDown,
  Activity,
  TrendingUp,
  BarChart3,
  CreditCard,
  FileSpreadsheet,
  RefreshCw,
  Mail,
  History,
  Globe
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { ServiceSEO } from '../components/SEO';
import { useProducts } from '../hooks/useProducts';
import { useShopAuth } from '../contexts/ShopAuthContext';
import { usePurchases } from '../contexts/PurchaseContext';
import { PaymentStatusWidget } from '../components/dashboard/PaymentStatusWidget';
import { TransactionalEmailTemplateManager } from '../components/admin/TransactionalEmailTemplateManager';
import { TransactionalEmailHistoryTab } from '../components/admin/TransactionalEmailHistoryTab';
import { AdminSeoManager } from '../components/admin/AdminSeoManager';
import { AdminSearchAnalyticsTab } from '../components/admin/AdminSearchAnalyticsTab';
import { FirebaseAnalyticsDashboard } from '../components/admin/FirebaseAnalyticsDashboard';
import { 
  ShopProduct, 
  SHOP_CATEGORIES, 
  ShopCategory,
  ProductType,
  PRODUCT_TYPES,
  inferProductType
} from '../data/shopProducts';
import { generateSlug } from '../services/productService';
import { syncAllShopRecordsToSheet, getStoredShopSheetId } from '../services/shopSheetsSync';

// Curated Unsplash images for quick selection by admin
const IMAGE_PRESETS = [
  {
    name: 'Legal Contract & Agreement',
    url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=800'
  },
  {
    name: 'Tax, VAT & Spreadsheet',
    url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=800'
  },
  {
    name: 'Corporate & Company Formation',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800'
  },
  {
    name: 'Employment & HR Policy',
    url: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=800'
  },
  {
    name: 'Legal Book & Handbook',
    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800'
  },
  {
    name: 'Legal Consultation & Advisory',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800'
  }
];

const MONTHLY_REVENUE_DATA = [
  { month: 'Jan', revenue: 18500, orders: 12 },
  { month: 'Feb', revenue: 24200, orders: 16 },
  { month: 'Mar', revenue: 31800, orders: 21 },
  { month: 'Apr', revenue: 29400, orders: 19 },
  { month: 'May', revenue: 42600, orders: 28 },
  { month: 'Jun', revenue: 58900, orders: 39 },
  { month: 'Jul', revenue: 52100, orders: 34 },
  { month: 'Aug', revenue: 64300, orders: 42 },
  { month: 'Sep', revenue: 78500, orders: 51 },
  { month: 'Oct', revenue: 92400, orders: 60 }
];

const POPULAR_PRODUCTS_DATA = [
  { name: 'Income Tax Return Kit 2026-27', sales: 42, revenue: 63000 },
  { name: 'Non-Disclosure Agreement (NDA)', sales: 31, revenue: 37200 },
  { name: 'Shareholders Agreement', sales: 28, revenue: 70000 },
  { name: 'Employment Contract', sales: 25, revenue: 30000 },
  { name: 'Company Incorporation Kit', sales: 18, revenue: 54000 }
];

const CATEGORY_SHARE_DATA = [
  { name: 'Tax & Financial Kits', value: 45, color: '#059669' },
  { name: 'Legal Contracts', value: 30, color: '#10b981' },
  { name: 'Corporate & Compliance', value: 15, color: '#34d399' },
  { name: 'Employment & HR', value: 10, color: '#6ee7b7' }
];

const RECENT_TRANSACTIONS = [
  { id: 'PAY-TXN-9988776', customer: 'Tanvir Ahmed', email: 'tanvir@example.com', product: 'Income Tax Return Kit 2026-27', amount: '1500.00', status: 'COMPLETED', date: '2026-10-16T01:10:29Z' },
  { id: 'PAY-TXN-9988775', customer: 'Sharmin Sultana', email: 'sharmin@example.com', product: 'Non-Disclosure Agreement (NDA)', amount: '1200.00', status: 'COMPLETED', date: '2026-10-16T00:45:12Z' },
  { id: 'PAY-TXN-9988774', customer: 'Rafiqul Islam', email: 'rafiqul@example.com', product: 'Shareholders Agreement', amount: '2500.00', status: 'COMPLETED', date: '2026-10-15T22:15:00Z' },
  { id: 'PAY-TXN-9988773', customer: 'Nusrat Jahan', email: 'nusrat@example.com', product: 'Employment Contract', amount: '1200.00', status: 'COMPLETED', date: '2026-10-15T19:30:44Z' },
  { id: 'PAY-TXN-9988772', customer: 'Mahbub Alam', email: 'mahbub@example.com', product: 'Company Incorporation Kit', amount: '3000.00', status: 'PENDING', date: '2026-10-15T18:10:22Z' }
];

export function AdminShop({
  initialTab = 'catalog'
}: {
  initialTab?: 'catalog' | 'analytics' | 'payments' | 'email-templates' | 'email-history' | 'seo' | 'search-analytics';
} = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { products, addOrUpdateProduct, updatePrice, removeProduct, resetDefaults, loading, togglePublishStatus } = useProducts();
  const { adminUser, logout } = useShopAuth();
  const { transactions, processRefund } = usePurchases();

  const handleRefund = (tx: any) => {
    const reason = window.prompt(`Enter refund reason for transaction ${tx.transactionId || tx.id}:`, 'Customer requested refund / duplicate order');
    if (reason !== null) {
      processRefund(tx.transactionId || tx.id, reason);
      setStatusMessage({
        type: 'success',
        text: `Successfully processed refund for transaction ${tx.transactionId || tx.id}. Firestore status updated to REFUNDED and audit log recorded.`
      });
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const [activeAdminTab, setActiveAdminTab] = useState<'catalog' | 'analytics' | 'payments' | 'email-templates' | 'email-history' | 'seo' | 'search-analytics'>(() => {
    if (location.pathname.includes('/seo') || location.search.includes('tab=seo')) {
      return 'seo';
    }
    if (location.pathname.includes('/search') || location.search.includes('tab=search-analytics')) {
      return 'search-analytics';
    }
    if (location.pathname.includes('/email-history') || location.search.includes('tab=email-history')) {
      return 'email-history';
    }
    if (location.pathname.includes('/email-templates') || location.search.includes('tab=email-templates')) {
      return 'email-templates';
    }
    return initialTab;
  });

  useEffect(() => {
    if (location.pathname.includes('/seo') || location.search.includes('tab=seo')) {
      setActiveAdminTab('seo');
    } else if (location.pathname.includes('/search') || location.search.includes('tab=search-analytics')) {
      setActiveAdminTab('search-analytics');
    } else if (location.pathname.includes('/email-history') || location.search.includes('tab=email-history')) {
      setActiveAdminTab('email-history');
    } else if (location.pathname.includes('/email-templates') || location.search.includes('tab=email-templates')) {
      setActiveAdminTab('email-templates');
    }
  }, [location.pathname, location.search]);

  // Filter & Search in Admin list
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('All');
  const [selectedFilterType, setSelectedFilterType] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Inline Price Editing State
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [inlinePriceInput, setInlinePriceInput] = useState<number | string>('');
  const [inlineOrigPriceInput, setInlineOrigPriceInput] = useState<number | string>('');
  const [savingPriceId, setSavingPriceId] = useState<string | null>(null);

  // Form mode: false = collapsed, 'create' = new product, 'edit' = editing product
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<ShopProduct['category']>('Legal Contracts');
  const [productType, setProductType] = useState<ProductType>('Templates');
  const [price, setPrice] = useState<number>(1000);
  const [originalPrice, setOriginalPrice] = useState<number>(1500);
  const [badge, setBadge] = useState<string>('New');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [format, setFormat] = useState('DOCX + PDF • Bilingual Clause Notes');
  const [pagesOrFiles, setPagesOrFiles] = useState('6 Pages • 2 File Formats');
  const [governingLaw, setGoverningLaw] = useState('Contract Act, 1872 & Arbitration Act, 2001 (Bangladesh)');
  const [authorOrVettedBy, setAuthorOrVettedBy] = useState('Adv. Ekram Hossain, Advocate, Supreme Court of Bangladesh');
  const [brochureUrl, setBrochureUrl] = useState('');
  const [requiresPurchaseToAccess, setRequiresPurchaseToAccess] = useState(false);
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [features, setFeatures] = useState<string[]>([
    'Fully editable Microsoft Word (.docx) & PDF file',
    'Clause-by-clause practitioner notes & guidelines',
    'Compliant with Bangladesh statutory laws & court precedents'
  ]);
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [samplePreviewSnippet, setSamplePreviewSnippet] = useState('');
  const [imageUrl, setImageUrl] = useState(IMAGE_PRESETS[0].url);

  // Status message
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncingToSheets, setIsSyncingToSheets] = useState(false);

  const handleQuickSyncShopToSheets = async () => {
    const sheetId = getStoredShopSheetId();
    if (!sheetId) {
      navigate('/workspace');
      return;
    }
    try {
      setIsSyncingToSheets(true);
      const res = await syncAllShopRecordsToSheet(sheetId);
      setStatusMessage({
        type: 'success',
        text: res.message
      });
      setTimeout(() => setStatusMessage(null), 4500);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to sync Shop Catalog & Orders to Google Sheets. Open /workspace to verify connection.'
      });
    } finally {
      setIsSyncingToSheets(false);
    }
  };

  // Auto-generate slug when title changes (if creating or if slug was untouched)
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (formMode === 'create') {
      setSlug(generateSlug(val));
    }
  };

  const handleOpenCreateForm = () => {
    setFormMode('create');
    setEditingId(null);
    setTitle('');
    setSlug('');
    setCategory('Legal Contracts');
    setProductType('Templates');
    setPrice(1200);
    setOriginalPrice(2000);
    setBadge('New');
    setStatus('published');
    setFormat('DOCX + PDF • Bilingual Notes');
    setPagesOrFiles('8 Pages • 2 File Formats (.docx, .pdf)');
    setGoverningLaw('Contract Act, 1872 (Bangladesh)');
    setAuthorOrVettedBy('Adv. Ekram Hossain, Advocate, Supreme Court of Bangladesh');
    setBrochureUrl('');
    setRequiresPurchaseToAccess(false);
    setShortDescription('');
    setFullDescription('');
    setFeatures([
      'Editable Microsoft Word (.docx) & Print-Ready PDF',
      'Clause-by-clause commentary and guidance notes',
      'Dhaka-seated dispute resolution and arbitration provisions'
    ]);
    setSamplePreviewSnippet('This Agreement is entered into by and between the First Party and the Second Party in accordance with the laws of Bangladesh...');
    setImageUrl(IMAGE_PRESETS[0].url);

    // Scroll to form
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const handleOpenEditForm = (prod: ShopProduct) => {
    setFormMode('edit');
    setEditingId(prod.id);
    setTitle(prod.title);
    setSlug(prod.slug);
    setCategory(prod.category);
    setProductType(prod.productType || inferProductType(prod));
    setPrice(prod.price);
    setOriginalPrice(prod.originalPrice);
    setBadge(prod.badge || '');
    setStatus(prod.status || 'published');
    setFormat(prod.format);
    setPagesOrFiles(prod.pagesOrFiles);
    setGoverningLaw(prod.governingLaw || '');
    setAuthorOrVettedBy(prod.authorOrVettedBy);
    setBrochureUrl(prod.brochureUrl || '');
    setRequiresPurchaseToAccess(!!prod.requiresPurchaseToAccess);
    setShortDescription(prod.shortDescription);
    setFullDescription(prod.fullDescription);
    setFeatures(prod.features && prod.features.length > 0 ? prod.features : ['Standard compliance clauses']);
    setSamplePreviewSnippet(prod.samplePreviewSnippet || '');
    setImageUrl(prod.imageUrl);

    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const handleAddFeature = () => {
    if (!newFeatureInput.trim()) return;
    setFeatures([...features, newFeatureInput.trim()]);
    setNewFeatureInput('');
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, idx) => idx !== index));
  };

  const handleTogglePublish = async (prod: ShopProduct) => {
    const nextStatus = prod.status === 'draft' ? 'published' : 'draft';
    setTogglingId(prod.id);
    try {
      await togglePublishStatus(prod.id);
      setStatusMessage({
        type: 'success',
        text: `"${prod.title}" is now ${nextStatus === 'published' ? 'Published (visible on public Shop page)' : 'Unpublished (saved as Draft and hidden from Shop)'}.`
      });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to update publication status'
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleStartEditPrice = (prod: ShopProduct) => {
    setEditingPriceId(prod.id);
    setInlinePriceInput(prod.price);
    setInlineOrigPriceInput(prod.originalPrice > prod.price ? prod.originalPrice : prod.price);
  };

  const handleCancelEditPrice = () => {
    setEditingPriceId(null);
    setInlinePriceInput('');
    setInlineOrigPriceInput('');
  };

  const handleSaveInlinePrice = async (prod: ShopProduct) => {
    const parsedPrice = Number(inlinePriceInput);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid non-negative price amount.' });
      return;
    }

    const parsedOrig = Number(inlineOrigPriceInput);
    const validOrig = !isNaN(parsedOrig) && parsedOrig >= parsedPrice ? parsedOrig : parsedPrice;

    setSavingPriceId(prod.id);
    try {
      await updatePrice(prod.id, parsedPrice, validOrig);
      setStatusMessage({
        type: 'success',
        text: `Price for "${prod.title}" updated to BDT ${parsedPrice.toLocaleString('en-IN')}. The Shop page and catalog now reflect this updated price automatically!`
      });
      setTimeout(() => setStatusMessage(null), 4000);
      setEditingPriceId(null);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to update product price.'
      });
    } finally {
      setSavingPriceId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setStatusMessage({ type: 'error', text: 'Product Title is required!' });
      return;
    }

    const finalSlug = slug.trim() || generateSlug(title);
    const productId = editingId || finalSlug;

    const productPayload: ShopProduct = {
      id: productId,
      title: title.trim(),
      slug: finalSlug,
      category,
      productType,
      price: Number(price) || 0,
      originalPrice: Number(originalPrice) || Number(price) || 0,
      rating: 4.95,
      reviewsCount: 15,
      format: format.trim() || 'Digital Package',
      badge: badge ? (badge as any) : undefined,
      status,
      shortDescription: shortDescription.trim() || title.trim(),
      fullDescription: fullDescription.trim() || shortDescription.trim() || title.trim(),
      governingLaw: governingLaw.trim() || undefined,
      pagesOrFiles: pagesOrFiles.trim() || '1 Package',
      features: features.length > 0 ? features : ['Complete document and guidelines included'],
      samplePreviewSnippet: samplePreviewSnippet.trim() || undefined,
      imageUrl: imageUrl.trim() || IMAGE_PRESETS[0].url,
      authorOrVettedBy: authorOrVettedBy.trim() || 'Adv. Ekram Hossain, Advocate Supreme Court of Bangladesh',
      brochureUrl: brochureUrl.trim() || undefined,
      requiresPurchaseToAccess: requiresPurchaseToAccess || (brochureUrl.trim().startsWith('/') || (brochureUrl.includes(window.location.host) && brochureUrl.startsWith('http')))
    };

    setIsSubmitting(true);
    try {
      await addOrUpdateProduct(productPayload);
      setStatusMessage({
        type: 'success',
        text: `Product "${title}" successfully ${formMode === 'edit' ? 'updated' : 'added to catalog'} with status: ${status.toUpperCase()}!`
      });
      setFormMode(null);
      setEditingId(null);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Could not save product' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, prodTitle: string) => {
    if (window.confirm(`Are you sure you want to remove "${prodTitle}" from the digital shop?`)) {
      try {
        await removeProduct(id);
        setStatusMessage({ type: 'success', text: `Product "${prodTitle}" removed successfully.` });
        setTimeout(() => setStatusMessage(null), 3000);
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: err?.message || 'Failed to delete' });
      }
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm('Reset all shop products back to the official default catalog? Any custom products will be overwritten.')) {
      try {
        await resetDefaults();
        setStatusMessage({ type: 'success', text: 'Shop catalog reset to default products.' });
        setTimeout(() => setStatusMessage(null), 3000);
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: err?.message || 'Failed to reset' });
      }
    }
  };

  // Filtered products list
  const filteredProducts = products.filter(p => {
    const pType = p.productType || inferProductType(p);
    const matchesSearch = 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedFilterCategory === 'All' || p.category === selectedFilterCategory;
    const matchesType = selectedFilterType === 'All' || pType === selectedFilterType;
    const matchesStatus = 
      selectedStatusFilter === 'all' ||
      (selectedStatusFilter === 'published' && p.status !== 'draft') ||
      (selectedStatusFilter === 'draft' && p.status === 'draft');
    return matchesSearch && matchesCat && matchesType && matchesStatus;
  });

  // Calculate catalog stats
  const totalProducts = products.length;
  const publishedCount = products.filter(p => p.status !== 'draft').length;
  const draftsCount = products.filter(p => p.status === 'draft').length;
  const avgPrice = totalProducts > 0 
    ? Math.round(products.reduce((acc, p) => acc + p.price, 0) / totalProducts) 
    : 0;
  const categoriesCount = new Set(products.map(p => p.category)).size;

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <ServiceSEO
        title="Admin: Digital Products Catalog Manager | Accounticca & E-Lawyers"
        description="Admin dashboard to add, edit, price, and manage digital legal templates, tax calculators, and business compliance kits."
        serviceType="Shop Product Administration"
        canonicalUrl="/admin/shop"
      />

      {/* Admin Session Security Top Bar */}
      <div className="bg-slate-950 border-b border-slate-800 text-xs py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-extrabold text-emerald-400 text-xs flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Authorized Session:</span>
            </span>
            <span className="text-white font-mono text-[11px] bg-slate-900 px-2.5 py-0.5 rounded border border-slate-700">
              {adminUser?.email || 'admin@admin.com'}
            </span>
            <span className="text-[11px] text-slate-400 hidden md:inline">
              (Server-Side Verified Identity)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/tools"
              className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors inline-flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tools Hub ({publishedCount} Published)</span>
            </Link>

            <button
              type="button"
              onClick={() => logout()}
              className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900/80 text-red-200 hover:text-white font-bold rounded text-xs transition-colors inline-flex items-center gap-1 border border-red-800/60 cursor-pointer"
              title="Terminate admin session and logout"
            >
              <LogOut className="w-3 h-3 text-red-400" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs & Action Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveAdminTab('catalog')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all inline-flex items-center gap-2 cursor-pointer ${
                activeAdminTab === 'catalog'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Product Catalog Manager</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-200 font-mono">
                {totalProducts}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAdminTab('analytics')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all inline-flex items-center gap-2 cursor-pointer ${
                activeAdminTab === 'analytics'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Sales & Revenue Analytics</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAdminTab('payments')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all inline-flex items-center gap-2 cursor-pointer ${
                activeAdminTab === 'payments'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Payment Status & Link Tracker</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAdminTab('email-templates')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all inline-flex items-center gap-2 cursor-pointer ${
                activeAdminTab === 'email-templates'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>Email Templates (Brevo)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAdminTab('email-history')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all inline-flex items-center gap-2 cursor-pointer ${
                activeAdminTab === 'email-history'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <History className="w-4 h-4 text-emerald-400" />
              <span>Email History</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAdminTab('seo')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all inline-flex items-center gap-2 cursor-pointer ${
                activeAdminTab === 'seo'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>SEO & Indexing</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAdminTab('search-analytics')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all inline-flex items-center gap-2 cursor-pointer ${
                activeAdminTab === 'search-analytics'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Search className="w-4 h-4 text-emerald-400" />
              <span>Search & Gaps</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleQuickSyncShopToSheets}
              disabled={isSyncingToSheets}
              className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 border border-emerald-200 cursor-pointer whitespace-nowrap"
              title="Synchronize all Shop Catalog items and Customer Orders to Google Sheets"
            >
              {isSyncingToSheets ? (
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin shrink-0" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              )}
              <span>{isSyncingToSheets ? 'Syncing Sheet...' : 'Sync to Google Sheets'}</span>
            </button>
            <Link
              to="/tools"
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 border border-slate-200 whitespace-nowrap"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Tools Hub</span>
            </Link>
            <button
              type="button"
              onClick={handleOpenCreateForm}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Add New Product</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {activeAdminTab === 'search-analytics' ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            <AdminSearchAnalyticsTab />
          </div>
        ) : activeAdminTab === 'seo' ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            <AdminSeoManager />
          </div>
        ) : activeAdminTab === 'email-history' ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            <TransactionalEmailHistoryTab />
          </div>
        ) : activeAdminTab === 'email-templates' ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            <TransactionalEmailTemplateManager />
          </div>
        ) : activeAdminTab === 'payments' ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            <PaymentStatusWidget />
          </div>
        ) : activeAdminTab === 'analytics' ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            <FirebaseAnalyticsDashboard />

            {/* Analytics Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
                  <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">BDT 283,200</div>
                <div className="text-xs font-bold text-emerald-600 inline-flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+24.8% vs last month (SSL Secure)</span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Transactions</span>
                  <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">134 Orders</div>
                <div className="text-xs font-bold text-blue-600 inline-flex items-center gap-1">
                  <span>99.25% Settlement Rate</span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Avg. Order Value</span>
                  <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Tag className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">BDT 2,113</div>
                <div className="text-xs font-bold text-purple-600 inline-flex items-center gap-1">
                  <span>High-value legal & tax kits</span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Gateway Status</span>
                  <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-xl font-black text-emerald-700 mt-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Worker & Sandbox Active</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">pay.ekram-elawyersbd.workers.dev</div>
              </div>
            </div>

            {/* Recharts Section 1: Monthly Revenue & Category Share */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Monthly Revenue Area Chart */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Monthly Revenue Generated (BDT)</h3>
                    <p className="text-xs text-slate-500">Automated gateway settlements throughout 2026</p>
                  </div>
                  <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200">
                    Peak: Oct (BDT 92,400)
                  </div>
                </div>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MONTHLY_REVENUE_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                        formatter={(val: any) => [`BDT ${Number(val).toLocaleString()}`, 'Revenue']}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#revenueGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Share Donut / Pie Chart */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Category Share</h3>
                  <p className="text-xs text-slate-500">Sales volume by product category</p>
                </div>

                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={CATEGORY_SHARE_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {CATEGORY_SHARE_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                        formatter={(val: any) => [`${val}%`, 'Share']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  {CATEGORY_SHARE_DATA.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="font-bold text-slate-700">{cat.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">{cat.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Recharts Section 2: Popular Products Bar Chart */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
              <div>
                <h3 className="text-lg font-black text-slate-900">Top Popular Products & Sales Revenue</h3>
                <p className="text-xs text-slate-500">Leading legal templates and tax kits by total sales volume</p>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={POPULAR_PRODUCTS_DATA} layout="vertical" margin={{ top: 10, right: 30, left: 120, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#64748b" fontSize={11} />
                    <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={150} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any, name: any) => [name === 'revenue' ? `BDT ${Number(val).toLocaleString()}` : val, name === 'revenue' ? 'Revenue' : 'Units Sold']}
                    />
                    <Bar dataKey="sales" fill="#059669" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Gateway Settlements Table */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
              <div>
                <h3 className="text-lg font-black text-slate-900">Recent Gateway Settlements</h3>
                <p className="text-xs text-slate-500">Live transaction feed received via webhook and instant checkout</p>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Transaction ID</th>
                      <th className="py-3 px-4">Customer / Ref</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Refund Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((tx, idx) => {
                      const isCompleted = tx.status === 'completed';
                      const isRefunded = tx.status === 'refunded';
                      const isPending = tx.status === 'pending';
                      return (
                        <tr key={`${tx.id || tx.transactionId || 'admin-tx'}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">{tx.transactionId}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">Verified Client</div>
                            <div className="text-[11px] text-slate-400 font-mono">{tx.referenceId || 'ACC-2026'}</div>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-700">{tx.productTitle}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">BDT {tx.amount.toLocaleString()}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                              isCompleted ? 'bg-emerald-100 text-emerald-800' : isRefunded ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-600' : isRefunded ? 'bg-purple-600' : 'bg-amber-600'}`} />
                              <span>{tx.status.toUpperCase()}</span>
                            </span>
                            {tx.refundReason && (
                              <div className="text-[10px] text-purple-700 mt-1 italic">Reason: {tx.refundReason}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{new Date(tx.date).toLocaleString()}</td>
                          <td className="py-3.5 px-4 text-right">
                            {isCompleted ? (
                              <button
                                type="button"
                                onClick={() => handleRefund(tx)}
                                className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 font-extrabold rounded-lg text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                                title="Process refund and log audit record"
                              >
                                <RotateCcw className="w-3 h-3 text-red-600" />
                                <span>Process Refund</span>
                              </button>
                            ) : isRefunded ? (
                              <span className="text-[11px] font-bold text-purple-700 font-mono">Refund Logged</span>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-mono">Pending Settlement</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ) : (
          <>

        {/* Status Toast Alert */}
        {statusMessage && (
          <div className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-md ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' 
              : 'bg-red-50 text-red-900 border border-red-300'
          }`}>
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Product Create / Edit Form Card */}
        {formMode && (
          <div className="bg-white rounded-3xl border-2 border-emerald-500/50 p-6 sm:p-8 shadow-xl space-y-8 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <Tag className="w-3.5 h-3.5" />
                  <span>{formMode === 'create' ? 'Create New Catalog Item' : 'Edit Existing Item'}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {formMode === 'create' ? 'Add New Product to Shop' : `Editing: ${title}`}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setFormMode(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Close Form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Form Fields Column (8 Cols) */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* 1. Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span>1. Product Identity & Category</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Product Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={title}
                          onChange={(e) => handleTitleChange(e.target.value)}
                          placeholder="e.g. Mutual Non-Disclosure Agreement (NDA) Pro Kit"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Short URL Slug (/shop/<span className="text-emerald-700">{slug || 'short-name'}</span>) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={slug}
                          onChange={(e) => setSlug(e.target.value.toLowerCase().trim().replace(/[^\w-]/g, ''))}
                          placeholder="e.g. mutual-nda-pro-kit"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm font-mono text-emerald-800 font-bold focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          This defines the direct page address: <code className="text-slate-600 font-mono">/shop/{slug || '...'}</code>
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Product Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={productType}
                          onChange={(e) => setProductType(e.target.value as ProductType)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none"
                        >
                          {PRODUCT_TYPES.filter(t => t !== 'All Types').map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Discipline / Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as ShopProduct['category'])}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none"
                        >
                          {SHOP_CATEGORIES.filter(c => c !== 'All Products').map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 2. Pricing & Highlights */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>2. Pricing & Marketing Tag</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Selling Price (BDT) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="50"
                          value={price}
                          onChange={(e) => setPrice(Number(e.target.value))}
                          placeholder="1200"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-sm font-black text-slate-900 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Regular / Crossed-Out Price (BDT)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={originalPrice}
                          onChange={(e) => setOriginalPrice(Number(e.target.value))}
                          placeholder="2000"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-sm font-bold text-slate-600 focus:outline-none"
                        />
                        {originalPrice > price && (
                          <span className="text-[11px] font-bold text-emerald-700 mt-1 block">
                            Auto Discount: {Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Highlight Badge
                        </label>
                        <select
                          value={badge}
                          onChange={(e) => setBadge(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none"
                        >
                          <option value="">No Badge</option>
                          <option value="Bestseller">Bestseller</option>
                          <option value="New">New</option>
                          <option value="Popular">Popular</option>
                          <option value="Essential">Essential</option>
                          <option value="Updated for 2026">Updated for 2026</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Publication Status <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value as 'published' | 'draft')}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm font-bold focus:outline-none"
                        >
                          <option value="published">● Published (Live on Shop)</option>
                          <option value="draft">○ Draft (Hidden from Shop)</option>
                        </select>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {status === 'published' ? 'Visible on public Shop' : 'Hidden from customers'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3. File & Legal Specs */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                        <Scale className="w-4 h-4 text-emerald-600" />
                        <span>3. Format, Pages, Vetting Authority & Brochure</span>
                      </h3>
                      <span className="text-[11px] text-slate-500 font-medium">Specs & Assets</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          File Format & Notes
                        </label>
                        <input
                          type="text"
                          value={format}
                          onChange={(e) => setFormat(e.target.value)}
                          placeholder="e.g. DOCX + PDF • Bilingual Clause Notes"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Pages / Scope
                        </label>
                        <input
                          type="text"
                          value={pagesOrFiles}
                          onChange={(e) => setPagesOrFiles(e.target.value)}
                          placeholder="e.g. 6 Pages • 2 File Formats"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Governing Law / Statutory Reference
                        </label>
                        <input
                          type="text"
                          value={governingLaw}
                          onChange={(e) => setGoverningLaw(e.target.value)}
                          placeholder="e.g. Contract Act, 1872 & Arbitration Act, 2001"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Vetted Authority / Counsel
                        </label>
                        <input
                          type="text"
                          value={authorOrVettedBy}
                          onChange={(e) => setAuthorOrVettedBy(e.target.value)}
                          placeholder="e.g. Adv. Ekram Hossain, Advocate Supreme Court of Bangladesh"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none"
                        />
                      </div>

                      {/* Product Brochure Link Field */}
                      <div className={`sm:col-span-2 p-4 rounded-2xl border shadow-2xs space-y-3 transition-all ${
                        requiresPurchaseToAccess || (brochureUrl.trim().startsWith('/') || (brochureUrl.includes(window.location.host) && brochureUrl.startsWith('http')))
                          ? 'bg-gradient-to-br from-amber-50/80 via-emerald-50/40 to-teal-50/50 border-amber-300 ring-2 ring-amber-500/10'
                          : 'bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border-emerald-200/80'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label htmlFor="product-brochure-link" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <FileDown className="w-4 h-4 text-emerald-600" />
                            <span>Brochure / Internal App Resource Link</span>
                            <span className="text-[10px] font-normal text-slate-500">(External URL or Internal Route)</span>
                          </label>

                          <div className="flex items-center gap-2">
                            {(requiresPurchaseToAccess || (brochureUrl.trim().startsWith('/') || (brochureUrl.includes(window.location.host) && brochureUrl.startsWith('http')))) && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                                <Lock className="w-3 h-3 text-amber-700" />
                                <span>Gated: Purchase Required</span>
                              </span>
                            )}
                            {brochureUrl && (
                              <a
                                href={brochureUrl}
                                target={brochureUrl.startsWith('/') ? undefined : '_blank'}
                                rel={brochureUrl.startsWith('/') ? undefined : 'noopener noreferrer'}
                                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Preview Link</span>
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Link2 className="h-4 w-4 text-emerald-600" />
                          </div>
                          <input
                            type="text"
                            id="product-brochure-link"
                            name="brochureUrl"
                            autoComplete="url"
                            value={brochureUrl}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBrochureUrl(val);
                              // Auto-enable gated access if link is an internal app route
                              if (val.trim().startsWith('/') || (val.includes(window.location.host) && val.startsWith('http'))) {
                                setRequiresPurchaseToAccess(true);
                              }
                            }}
                            placeholder="/tax-refund-guide or https://drive.google.com/file.pdf"
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none text-slate-900 shadow-2xs transition-all"
                          />
                        </div>

                        {/* Gated Access Enforcer for internal app links */}
                        <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <label className="flex items-start sm:items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={requiresPurchaseToAccess || (brochureUrl.trim().startsWith('/') || (brochureUrl.includes(window.location.host) && brochureUrl.startsWith('http')))}
                              onChange={(e) => setRequiresPurchaseToAccess(e.target.checked)}
                              className="mt-0.5 sm:mt-0 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <div className="text-xs">
                              <span className="font-bold text-slate-800">
                                Restrict to Completed Purchases
                              </span>
                              <span className="text-slate-500 block text-[11px] leading-tight">
                                User cannot enter or use this link without completing the shop purchase. After completing payment, access is unlocked.
                              </span>
                            </div>
                          </label>

                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300/70 font-semibold shrink-0">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span>Unlocked After Payment</span>
                          </div>
                        </div>

                        {/* Informational notice when internal route is gated */}
                        {(requiresPurchaseToAccess || (brochureUrl.trim().startsWith('/') || (brochureUrl.includes(window.location.host) && brochureUrl.startsWith('http')))) && (
                          <div className="p-3 bg-gradient-to-r from-amber-50 to-emerald-50/50 rounded-xl border border-amber-300 text-[11px] text-amber-950 flex items-start gap-2.5 shadow-2xs">
                            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                            <div className="leading-snug space-y-1">
                              <div>
                                <strong>Payment Access Gate Active:</strong> Without completing the shop payment process, visitors are barred from using this link.
                              </div>
                              <div className="text-emerald-900 font-semibold flex items-center gap-1 pt-0.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>After completing the payment, user can immediately access and enter this link from the checkout confirmation, product page, and user profile.</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4. Descriptions */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span>4. Short & Comprehensive Descriptions</span>
                    </h3>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Short Description (Catalog Cards)
                      </label>
                      <textarea
                        rows={2}
                        value={shortDescription}
                        onChange={(e) => setShortDescription(e.target.value)}
                        placeholder="Brief 1-2 sentence overview highlighting main protection or utility..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm font-medium focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Full Comprehensive Description (Product Detail Page)
                      </label>
                      <textarea
                        rows={4}
                        value={fullDescription}
                        onChange={(e) => setFullDescription(e.target.value)}
                        placeholder="Detailed legal commentary, clause background, execution context, and specific benefits..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm font-medium focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* 5. Features List */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
                      5. Inclusions & Key Features (Bullet Points)
                    </label>

                    <div className="space-y-2">
                      {features.map((feat, index) => (
                        <div key={index} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-xs font-medium text-slate-800 flex-1">{feat}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(index)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded-md"
                            title="Remove feature"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={newFeatureInput}
                        onChange={(e) => setNewFeatureInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddFeature();
                          }
                        }}
                        placeholder="Add another feature (e.g. Non-solicitation covenants included)..."
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs font-medium focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Add Bullet
                      </button>
                    </div>
                  </div>

                  {/* 6. Sample Snippet */}
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
                      6. Document Excerpt / Sample Clause Snippet
                    </label>
                    <textarea
                      rows={2}
                      value={samplePreviewSnippet}
                      onChange={(e) => setSamplePreviewSnippet(e.target.value)}
                      placeholder="e.g. The Receiving Party agrees to hold all proprietary confidential materials in strict confidence..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs font-mono text-slate-700 focus:outline-none"
                    />
                  </div>

                  {/* 7. Image Presets & Custom URL */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
                      7. Cover Image
                    </label>
                    
                    {/* Quick presets buttons */}
                    <div className="flex flex-wrap gap-2">
                      {IMAGE_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setImageUrl(preset.url)}
                          className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                            imageUrl === preset.url
                              ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>

                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs font-medium focus:outline-none"
                    />
                  </div>

                </div>


                {/* Live Card Preview Column (4 Cols) */}
                <div className="lg:col-span-4 bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4 sticky top-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      Live Shop Card Preview
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                      Real-time
                    </span>
                  </div>

                  {/* Card mockup */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="relative aspect-16/10 bg-slate-200 overflow-hidden">
                      <img
                        src={imageUrl || IMAGE_PRESETS[0].url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                        {badge && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-900/90 text-amber-300">
                            {badge}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/90 text-slate-800">
                          {category}
                        </span>
                      </div>
                      <div className="absolute top-2.5 right-2.5">
                        {status === 'draft' ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500 text-white shadow-xs">
                            Draft (Hidden)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-600 text-white shadow-xs">
                            Published
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 text-[10px] bg-slate-900/80 text-white px-2 py-1 rounded-md flex justify-between">
                        <span className="truncate">{format || 'DOCX + PDF'}</span>
                        <span className="text-emerald-300 font-mono">{pagesOrFiles || '6 Pages'}</span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h4 className="font-extrabold text-xs text-slate-900 line-clamp-2">
                        {title || 'Untitled Product'}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {shortDescription || 'Short description will appear here...'}
                      </p>
                      <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                        <div>
                          <div className="text-[9px] text-slate-400 uppercase font-semibold">One-Time Fee</div>
                          <div className="font-black text-sm text-slate-900">
                            BDT {Number(price || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                          Preview
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-1 bg-white p-3 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-700">Dedicated Page URL:</div>
                    <code className="text-emerald-700 font-mono break-all text-[10px] font-bold">
                      /shop/{slug || '...'}
                    </code>
                  </div>

                </div>

              </div>


              {/* Form Action Buttons */}
              <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFormMode(null)}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-md inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{formMode === 'create' ? 'Publish Product to Shop' : 'Save Changes'}</span>
                </button>
              </div>

            </form>
          </div>
        )}


        {/* Catalog Table & Management Section */}
        <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                Catalog Items ({filteredProducts.length})
              </h2>
              <p className="text-xs text-slate-500">
                Search, edit price, inspect live preview page, or remove items.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                title="Restore default product catalog"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset Defaults</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreateForm}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* Status Quick Filter Tabs & Search Bar */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-500 mr-1">Status Filter:</span>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedStatusFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                All Products ({totalProducts})
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('published')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedStatusFilter === 'published'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Published ({publishedCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('draft')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedStatusFilter === 'draft'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Drafts ({draftsCount})</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products by title, slug, or keywords..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={selectedFilterType}
                  onChange={(e) => setSelectedFilterType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs font-semibold focus:outline-none"
                >
                  <option value="All">All Types ({products.length})</option>
                  {PRODUCT_TYPES.filter(t => t !== 'All Types').map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <select
                  value={selectedFilterCategory}
                  onChange={(e) => setSelectedFilterCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs font-semibold focus:outline-none"
                >
                  <option value="All">All Categories ({products.length})</option>
                  {SHOP_CATEGORIES.filter(c => c !== 'All Products').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Products Table (At a glance, zero scroll, 100% visible, black text) */}
          <div className="w-full overflow-hidden border border-slate-300 rounded-2xl bg-white shadow-2xs">
            <table className="w-full table-fixed text-left border-collapse text-xs text-black">
              <colgroup>
                <col className="w-[28%]" />
                <col className="w-[15%]" />
                <col className="w-[12%]" />
                <col className="w-[18%]" />
                <col className="w-[13%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-300 text-black font-black uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 text-black">Item Details</th>
                  <th className="py-3 px-3 text-black">Type & Category</th>
                  <th className="py-3 px-3 text-black">Status</th>
                  <th className="py-3 px-3 text-black bg-emerald-50/90 border-x border-emerald-200">
                    <div className="flex items-center gap-1.5">
                      <span className="text-black font-black">Price (BDT)</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-700 text-white uppercase tracking-wider shadow-2xs">
                        Quick Edit
                      </span>
                    </div>
                  </th>
                  <th className="py-3 px-3 text-black">Direct Page</th>
                  <th className="py-3 px-3 text-right text-black">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredProducts.map((prod) => {
                  const isDraft = prod.status === 'draft';
                  const isToggling = togglingId === prod.id;
                  const pType = prod.productType || inferProductType(prod);

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                      
                      {/* Item */}
                      <td className="py-3 px-3 align-middle">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={prod.imageUrl || '/logo.png'}
                            alt={prod.title}
                            className="w-10 h-10 object-cover rounded-lg border border-slate-300 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-black text-black text-xs leading-snug line-clamp-1 hover:line-clamp-2" title={prod.title}>
                              {prod.title}
                            </div>
                            <div className="text-[11px] font-bold text-black/80 truncate">
                              {prod.format}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type & Category */}
                      <td className="py-3 px-3 align-middle">
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              pType === 'Templates'
                                ? 'bg-emerald-100 text-black border border-emerald-400'
                                : pType === 'Legal Kits'
                                ? 'bg-indigo-100 text-black border border-indigo-400'
                                : pType === 'Consultation'
                                ? 'bg-purple-100 text-black border border-purple-400'
                                : 'bg-amber-100 text-black border border-amber-400'
                            }`}>
                              {pType}
                            </span>
                            {prod.badge && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-900 text-amber-300">
                                {prod.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-black truncate max-w-full block" title={prod.category}>
                            {prod.category}
                          </span>
                        </div>
                      </td>

                      {/* Status Indicator Badge */}
                      <td className="py-3 px-3 align-middle">
                        {isDraft ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-black border border-amber-400 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            <span>Draft</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-black border border-emerald-400 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            <span>Published</span>
                          </span>
                        )}
                      </td>

                      {/* Price (Interactive & Editable) */}
                      <td className="py-3 px-3 align-middle bg-emerald-50/30 border-x border-emerald-100">
                        {editingPriceId === prod.id ? (
                          <div className="p-2 bg-white rounded-xl border-2 border-emerald-600 shadow-md space-y-1.5 w-full">
                            <div>
                              <label className="text-[10px] font-black text-black uppercase tracking-wider block">
                                Price (BDT) *
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={inlinePriceInput}
                                onChange={(e) => setInlinePriceInput(e.target.value)}
                                className="w-full px-2 py-1 text-xs font-mono font-bold bg-slate-50 border border-slate-400 rounded text-black focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                placeholder="e.g. 1500"
                                autoFocus
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-black uppercase tracking-wider block">
                                Original (BDT)
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={inlineOrigPriceInput}
                                onChange={(e) => setInlineOrigPriceInput(e.target.value)}
                                className="w-full px-2 py-0.5 text-[11px] font-mono font-bold bg-slate-50 border border-slate-300 rounded text-black focus:outline-none"
                                placeholder="Optional"
                              />
                            </div>
                            <div className="flex items-center gap-1 pt-0.5">
                              <button
                                type="button"
                                onClick={() => handleSaveInlinePrice(prod)}
                                disabled={savingPriceId === prod.id}
                                className="flex-1 py-1 px-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-[10px] font-black rounded flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                                title="Save updated price"
                              >
                                <Check className="w-3 h-3 text-white" />
                                <span>{savingPriceId === prod.id ? '...' : 'Save'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEditPrice}
                                disabled={savingPriceId === prod.id}
                                className="p-1 bg-slate-200 hover:bg-slate-300 text-black rounded transition-colors cursor-pointer"
                                title="Cancel"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="min-w-0">
                              <div className="font-black text-black text-xs sm:text-sm flex items-center gap-1">
                                <span className="truncate">BDT {prod.price.toLocaleString('en-IN')}</span>
                                {prod.price === 0 && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-200 text-black font-black uppercase">
                                    Free
                                  </span>
                                )}
                              </div>
                              {prod.originalPrice > prod.price && (
                                <div className="text-[10px] line-through text-black/70 font-bold truncate">
                                  BDT {prod.originalPrice.toLocaleString('en-IN')}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleStartEditPrice(prod)}
                              className="px-1.5 py-1 text-black bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded text-[10px] font-black flex items-center gap-0.5 shrink-0 transition-all cursor-pointer shadow-2xs"
                              title="Update price"
                            >
                              <Edit3 className="w-3 h-3 text-emerald-800" />
                              <span>Edit</span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Direct Page URL */}
                      <td className="py-3 px-3 align-middle">
                        <Link
                          to={`/shop/${prod.slug}`}
                          target="_blank"
                          className="text-black hover:text-emerald-800 font-mono text-[11px] font-bold inline-flex items-center gap-1 hover:underline truncate max-w-full"
                          title={`/shop/${prod.slug}`}
                        >
                          <span className="truncate">/shop/{prod.slug}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 text-black" />
                        </Link>
                      </td>

                      {/* Actions Column */}
                      <td className="py-3 px-3 align-middle text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          
                          {/* 1-Click Publish / Unpublish Toggle Button */}
                          {isDraft ? (
                            <button
                              type="button"
                              onClick={() => handleTogglePublish(prod)}
                              disabled={isToggling}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] font-black transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                              title="Publish item to live Shop page"
                            >
                              <Check className="w-3 h-3 text-white" />
                              <span>Publish</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleTogglePublish(prod)}
                              disabled={isToggling}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-amber-100 text-black border border-slate-300 hover:border-amber-400 rounded text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
                              title="Unpublish item to draft"
                            >
                              <EyeOff className="w-3 h-3 text-black" />
                              <span>Unpublish</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditForm(prod)}
                            className="p-1.5 text-black hover:text-emerald-700 hover:bg-slate-100 rounded border border-slate-200 transition-colors cursor-pointer"
                            title="Edit Product Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          
                          <Link
                            to={`/shop/${prod.slug}`}
                            target="_blank"
                            className="p-1.5 text-black hover:text-blue-700 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                            title="View Live Page"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDelete(prod.id, prod.title)}
                            className="p-1.5 text-black hover:text-red-700 hover:bg-red-50 rounded border border-slate-200 transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-black font-bold text-sm">
                      No products matched your search or status filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </section>

          </>
        )}

      </main>
    </div>
  );
}

export default AdminShop;
