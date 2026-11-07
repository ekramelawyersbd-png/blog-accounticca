import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  ShoppingBag, 
  CheckCircle2, 
  FileCheck2, 
  Download, 
  Sparkles, 
  ArrowLeft, 
  ExternalLink,
  Check,
  AlertCircle,
  LogOut,
  FileSpreadsheet,
  Mail,
  Copy,
  Send,
  Eye,
  Code2,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { z } from 'zod';
import { PatternFormat } from 'react-number-format';
import { useDebounce, useDebouncedZodValidation } from '../hooks/useDebounce';

export const checkoutFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Please complete your full name (minimum 2 characters).'),
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required.')
    .email('Please enter a valid email address to receive your order confirmation and digital kit.'),
  phone: z
    .string()
    .transform((val) => val.replace(/[_-\s()]/g, '').trim())
    .refine((val) => val.length >= 6, 'Please enter an active phone or WhatsApp number (at least 6 digits).'),
  company: z.string().optional(),
  tin: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const digits = val.replace(/[^0-9]/g, '');
        return digits.length === 0 || (digits.length >= 10 && digits.length <= 13);
      },
      'Tax Identification Number (e-TIN) should be 10 to 13 digits.'
    ),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: 'Please verify your contact details and agree to the digital procurement terms & conditions.'
  }),
  itemsCount: z.number().min(1, 'Please select at least one item for checkout.')
});

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

import { useCart } from '../contexts/CartContext';
import { usePurchases } from '../contexts/PurchaseContext';
import { useAuth } from '../contexts/AuthContext';
import { auth, fallbackAuth, db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useProducts } from '../hooks/useProducts';
import { SHOP_PRODUCTS, ShopProduct, inferProductType } from '../data/shopProducts';
import { SEO } from '../components/SEO';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { getAccessToken } from '../services/workspaceAuth';
import { getStoredShopSheetId, appendShopOrderToSheet } from '../services/shopSheetsSync';
import {
  sendShopOrderConfirmationEmail,
  SHOP_ORDER_HTML_TEMPLATE,
  type OrderConfirmationEmailResult
} from '../utils/emailService';
import { generateShopOrderEmailHtml } from '../utils/shopOrderEmailTemplate';
import { FieldTooltip } from '../components/ui/FieldTooltip';
import { initiateUddoktaPayCheckout, savePendingUddoktaCheckout } from '../services/uddoktapayService';

/**
 * Builds the official Paymently URL with pre-filled query parameters for the customer
 * (client name, email, mobile phone, payment amount, order reference, etc.)
 */
function buildPaymentlyUrl(params: {
  amount: number;
  name: string;
  email: string;
  phone: string;
  company?: string;
  referenceId: string;
  remarks?: string;
  mode?: 'internal' | 'external';
}): string {
  const baseUrl = params.mode === 'external'
    ? 'https://elawyers.paymently.io/paymentlink/default/BDT'
    : '/paymently';
  const query = new URLSearchParams();

  if (params.amount > 0) {
    query.set('amount', params.amount.toString());
  }
  if (params.name) {
    query.set('name', params.name);
    query.set('full_name', params.name);
    query.set('customer_name', params.name);
    query.set('client_name', params.name);
  }
  if (params.email) {
    query.set('email', params.email);
    query.set('customer_email', params.email);
    query.set('mail', params.email);
  }
  if (params.phone) {
    query.set('phone', params.phone);
    query.set('mobile', params.phone);
    query.set('mobile_number', params.phone);
    query.set('customer_phone', params.phone);
  }
  if (params.referenceId) {
    query.set('reference', params.referenceId);
    query.set('reference_id', params.referenceId);
    query.set('order_id', params.referenceId);
  }
  if (params.remarks) {
    query.set('remarks', params.remarks);
    query.set('description', params.remarks);
    query.set('note', params.remarks);
  }
  if (params.company) {
    query.set('company', params.company);
  }
  if (params.mode === 'external' && typeof window !== 'undefined' && window.location?.origin) {
    query.set('redirect_url', `${window.location.origin}/payment/verify?order_id=${encodeURIComponent(params.referenceId)}`);
    query.set('return_url', `${window.location.origin}/payment/verify?order_id=${encodeURIComponent(params.referenceId)}`);
    query.set('cancel_url', `${window.location.origin}/payment/cancel?order_id=${encodeURIComponent(params.referenceId)}`);
  }

  const qs = query.toString();
  return qs ? `${baseUrl}?${qs}` : baseUrl;
}

export const CheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const productSlug = searchParams.get('product') || searchParams.get('slug');
  const singleQty = useMemo(() => {
    const raw = parseInt(searchParams.get('qty') || '1', 10);
    return Number.isFinite(raw) && raw > 0 ? raw : 1;
  }, [searchParams]);
  
  const { products } = useProducts();
  const { items, subtotal, discount, total, clearCart, removeFromCart } = useCart();
  const { purchaseProduct, isPurchased, isPendingPurchase, activeUserId, activeUserEmail } = usePurchases();
  const { user, authUser, signInWithGoogle, signInWithFacebook, logout } = useAuth();

  // Determine if purchasing a single product from URL or cart items
  const singleProduct = useMemo(() => {
    if (!productSlug) return null;
    return (
      products.find(p => p.slug === productSlug || p.id === productSlug) ||
      SHOP_PRODUCTS.find(p => p.slug === productSlug || p.id === productSlug) ||
      null
    );
  }, [productSlug, products]);

  const rawCheckoutItems = singleProduct 
    ? [{ product: { ...singleProduct, price: singleProduct.price || 10 }, quantity: singleQty }] 
    : items.length > 0
      ? items.map(item => ({ ...item, product: { ...item.product, price: item.product.price || 10 } }))
      : [];

  const alreadyPurchasedCheckoutItems = useMemo(
    () => rawCheckoutItems.filter(item => isPurchased(item.product.id) || isPurchased(item.product.slug)),
    [rawCheckoutItems, isPurchased]
  );

  const pendingCheckoutItems = useMemo(
    () => rawCheckoutItems.filter(item => isPendingPurchase(item.product.id) || isPendingPurchase(item.product.slug)),
    [rawCheckoutItems, isPendingPurchase]
  );

  const checkoutItems = useMemo(
    () => rawCheckoutItems.filter(
      item =>
        !isPurchased(item.product.id) &&
        !isPurchased(item.product.slug) &&
        !isPendingPurchase(item.product.id) &&
        !isPendingPurchase(item.product.slug)
    ),
    [rawCheckoutItems, isPurchased, isPendingPurchase]
  );

  const rawSubtotal = checkoutItems.reduce((acc, curr) => acc + (curr.product?.price || 10) * curr.quantity, 0);
  const orderSubtotal = rawSubtotal > 0 ? rawSubtotal : (checkoutItems.length > 0 ? 10 : 0);
  const orderDiscount = 0;
  const orderTotal = Math.max(0, orderSubtotal - orderDiscount);

  const isFree = checkoutItems.length > 0 && orderTotal === 0;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [tin, setTin] = useState('');
  const [trxId, setTrxId] = useState('');
  const [copiedBkash, setCopiedBkash] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [selectedGateway, setSelectedGateway] = useState<'uddoktapay' | 'paymently'>('uddoktapay');
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);

  const activeProvider = useMemo<'google' | 'facebook' | 'email' | null>(() => {
    if (authUser?.provider === 'google' || authUser?.provider === 'facebook' || authUser?.provider === 'email') {
      return authUser.provider;
    }
    const providerData = user?.providerData || [];
    if (providerData.some((p) => p.providerId === 'google.com')) return 'google';
    if (providerData.some((p) => p.providerId === 'facebook.com')) return 'facebook';
    if (user?.email) return 'email';
    return null;
  }, [authUser, user]);

  const isSocialAuthenticated = Boolean((authUser || user) && activeProvider);
  const debouncedEmail = useDebounce(email, 300);
  const { fieldErrors: debouncedCheckoutErrors } = useDebouncedZodValidation(
    checkoutFormSchema,
    {
      fullName,
      email,
      phone,
      company,
      tin,
      agreeTerms,
      itemsCount: checkoutItems.length
    },
    300
  );
  const isEmailValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(debouncedEmail.trim()) && !debouncedCheckoutErrors.email,
    [debouncedEmail, debouncedCheckoutErrors.email]
  );
  const authenticatedUid = authUser?.uid || user?.uid || '';
  const authenticatedPhoto = authUser?.photoURL || user?.photoURL || null;

  useEffect(() => {
    if (authUser || user) {
      const providerEmail = user?.providerData?.find((p) => p?.email)?.email || '';
      const resolvedName =
        authUser?.displayName ||
        user?.displayName ||
        user?.providerData?.find((p) => p?.displayName)?.displayName ||
        '';
      const resolvedEmail = (authUser?.email || user?.email || providerEmail || '').trim();
      const resolvedPhone = user?.phoneNumber || '';
      if (resolvedName) setFullName((prev) => prev || resolvedName);
      if (resolvedEmail) setEmail((prev) => prev || resolvedEmail);
      if (resolvedPhone) setPhone((prev) => prev || resolvedPhone);
      setSocialError(null);
    }
  }, [authUser, user]);

  // BroadcastChannel listener for multi-tab payment success synchronization
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('accounticca_payment_sync');
        bc.onmessage = (event) => {
          if (event.data && event.data.type === 'PAYMENT_COMPLETED') {
            const refId = event.data.referenceId || 'ACC-PAID';
            setCompletedOrderNumber(refId);
            setPurchasedProducts(checkoutItems.map((i) => i.product));
            setIsOrderComplete(true);
            if (!singleProduct) {
              clearCart();
            }
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel listener notice:', e);
    }
    return () => {
      if (bc) bc.close();
    };
  }, [checkoutItems, singleProduct, clearCart]);

  const handleGoogleLogin = async () => {
    setSocialError(null);
    setSocialLoading('google');
    try {
      const session = await signInWithGoogle();
      if (session.displayName) setFullName(session.displayName);
      if (session.email) setEmail(session.email);
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked') {
        setSocialError('Popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (err?.code === 'auth/account-exists-with-different-credential') {
        setSocialError('An account already exists with this email using a different sign-in provider.');
      } else if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        setSocialError(err?.message || 'Firebase Google authentication failed. Please try again.');
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleFacebookLogin = async () => {
    setSocialError(null);
    setSocialLoading('facebook');
    try {
      const session = await signInWithFacebook();
      if (session.displayName) setFullName(session.displayName);
      if (session.email) setEmail(session.email);
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked') {
        setSocialError('Popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (err?.code === 'auth/account-exists-with-different-credential') {
        setSocialError('An account already exists with this email using a different sign-in provider.');
      } else if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        setSocialError(err?.message || 'Firebase Facebook authentication failed. Please try again.');
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleClearCheckoutForm = () => {
    const defaultName = authUser?.displayName || user?.displayName || '';
    const defaultEmail = authUser?.email || user?.email || '';
    setFullName(defaultName);
    setEmail(defaultEmail);
    setPhone('');
    setCompany('');
    setTrxId('');
    setAgreeTerms(true);
    setSocialError(null);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOrderComplete, setIsOrderComplete] = useState(false);
  const [completedOrderNumber, setCompletedOrderNumber] = useState('');
  const [purchasedProducts, setPurchasedProducts] = useState<ShopProduct[]>([]);
  const [orderSheetSynced, setOrderSheetSynced] = useState<boolean>(false);
  const [orderEmailResult, setOrderEmailResult] = useState<OrderConfirmationEmailResult | null>(null);
  const [paymentRedirectUrl, setPaymentRedirectUrl] = useState<string | null>(null);
  const [completedOrderSnapshot, setCompletedOrderSnapshot] = useState<{
    items: Array<{
      productId: string;
      slug?: string;
      title: string;
      category: string;
      productType?: string;
      format: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: string;
    trxId: string;
  } | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailPreviewTab, setEmailPreviewTab] = useState<'rendered' | 'template'>('rendered');
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testEmailFeedback, setTestEmailFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
    previewUrl?: string;
  } | null>(null);

  const liveEmailPreview = useMemo(() => {
    const activeItems =
      completedOrderSnapshot?.items ||
      checkoutItems.map((item) => ({
        productId: item.product.id,
        slug: item.product.slug,
        title: item.product.title,
        category: item.product.category,
        productType: item.product.productType || inferProductType(item.product),
        format: item.product.format,
        quantity: item.quantity,
        unitPrice: item.product.price,
        lineTotal: item.product.price * item.quantity
      }));
    const activeSubtotal = completedOrderSnapshot?.subtotal ?? orderSubtotal;
    const activeDiscount = completedOrderSnapshot?.discount ?? orderDiscount;
    const activeTotal = completedOrderSnapshot?.total ?? orderTotal;
    const providerLabel = activeProvider === 'facebook' ? 'Facebook Auth' : 'Google Auth';
    const activeMethod =
      completedOrderSnapshot?.paymentMethod ||
      (activeTotal === 0 ? `Free Access (${providerLabel})` : `bKash Personal (${providerLabel})`);
    const activeTrxId =
      completedOrderSnapshot?.trxId || (activeTotal === 0 ? 'FREE-ACCESS' : trxId.trim().toUpperCase() || 'PENDING-TRX');

    return generateShopOrderEmailHtml({
      orderId: completedOrderNumber || `ACC-${new Date().getFullYear()}-PREVIEW`,
      customerName: fullName.trim() || 'Valued Client',
      customerEmail: email.trim().toLowerCase() || 'client@example.com',
      customerPhone: phone.trim() || '+880 17XX-XXXXXX',
      companyName: company.trim() || 'Direct Individual Client',
      items: activeItems,
      subtotal: activeSubtotal,
      discount: activeDiscount,
      totalCost: activeTotal,
      paymentMethod: activeMethod,
      trxId: activeTrxId
    });
  }, [
    completedOrderSnapshot,
    checkoutItems,
    orderSubtotal,
    orderDiscount,
    orderTotal,
    activeProvider,
    trxId,
    completedOrderNumber,
    fullName,
    email,
    phone,
    company
  ]);

  const handleCopyEmailTemplate = () => {
    navigator.clipboard.writeText(SHOP_ORDER_HTML_TEMPLATE);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  const handleResendConfirmationEmail = async () => {
    if (!completedOrderSnapshot || !completedOrderNumber) return;
    setResendingEmail(true);
    try {
      const emailRes = await sendShopOrderConfirmationEmail({
        orderId: completedOrderNumber,
        customerName: fullName.trim() || 'Valued Client',
        customerEmail: email.trim().toLowerCase(),
        customerPhone: phone.trim(),
        companyName: company.trim() || 'Direct Individual Client',
        items: completedOrderSnapshot.items,
        subtotal: completedOrderSnapshot.subtotal,
        discount: completedOrderSnapshot.discount,
        totalCost: completedOrderSnapshot.total,
        paymentMethod: completedOrderSnapshot.paymentMethod,
        trxId: completedOrderSnapshot.trxId,
        authProvider: activeProvider === 'facebook' ? 'facebook' : 'google'
      });
      setOrderEmailResult(emailRes);
    } finally {
      setResendingEmail(false);
    }
  };

  const handleCopyBkash = () => {
    navigator.clipboard.writeText('01744883636');
    setCopiedBkash(true);
    setTimeout(() => setCopiedBkash(false), 2000);
  };

  const handleSendTestOrderEmail = async () => {
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      setTestEmailFeedback({
        type: 'error',
        text: 'Please enter a valid email address in the Email Address field above first.'
      });
      return;
    }

    setTestEmailSending(true);
    setTestEmailFeedback(null);
    try {
      const sampleOrderNum = completedOrderNumber || `ACC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const providerLabel =
        activeProvider === 'facebook'
          ? 'Facebook Auth'
          : activeProvider === 'google'
          ? 'Google Auth'
          : 'Verified Email';
      const methodLabel = isFree
        ? `Free Access (${providerLabel})`
        : `bKash Personal (${providerLabel})`;
      const resolvedTrxId = isFree ? 'FREE-ACCESS' : trxId.trim().toUpperCase() || 'VERIFIED-ORDER';

      const itemsList = checkoutItems.map((item) => ({
        productId: item.product.id,
        slug: item.product.slug,
        title: item.product.title,
        category: item.product.category,
        productType: item.product.productType || inferProductType(item.product),
        format: item.product.format,
        quantity: item.quantity,
        unitPrice: item.product.price,
        lineTotal: item.product.price * item.quantity
      }));

      const res = await sendShopOrderConfirmationEmail({
        orderId: sampleOrderNum,
        customerName: fullName.trim() || 'Valued Client',
        customerEmail: targetEmail,
        customerPhone: phone.trim() || '+880 17XX-XXXXXX',
        companyName: company.trim() || 'Direct Individual Client',
        items: itemsList,
        subtotal: orderSubtotal,
        discount: orderDiscount,
        totalCost: orderTotal,
        paymentMethod: methodLabel,
        trxId: resolvedTrxId,
        authProvider: activeProvider === 'facebook' ? 'facebook' : 'google'
      });

      setOrderEmailResult(res);
      setTestEmailFeedback({
        type: 'success',
        text: `Confirmation email dispatched to ${targetEmail} (${itemsList.length} item(s) • BDT ${orderTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}).`,
        previewUrl: res.previewUrl
      });
    } catch (err: any) {
      setTestEmailFeedback({
        type: 'error',
        text: err?.message || 'Unable to send confirmation email. Please check your email address.'
      });
    } finally {
      setTestEmailSending(false);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationResult = checkoutFormSchema.safeParse({
      fullName,
      email,
      phone,
      company,
      agreeTerms,
      itemsCount: checkoutItems.length
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]?.message || 'Please complete all required fields.';
      setSocialError(firstError);
      return;
    }

    setSocialError(null);
    setIsSubmitting(true);

    try {
      const firebaseCurrentUser = auth.currentUser || fallbackAuth.currentUser;
      if (firebaseCurrentUser) {
        await firebaseCurrentUser.getIdToken();
      }
      if (authenticatedUid) {
        await setDoc(
          doc(db, 'users', authenticatedUid),
          {
            email: email.trim().toLowerCase(),
            displayName: fullName.trim(),
            createdAt: serverTimestamp()
          },
          { merge: true }
        ).catch(() => {});
      }
    } catch {
      // Non-blocking profile sync fallback
    }

    const orderNum = `ACC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const prods = checkoutItems.map((i) => i.product);
    const providerLabel = activeProvider === 'facebook' ? 'Facebook Auth' : 'Google Auth';
    const methodLabel = isFree
      ? `Free Access (${providerLabel})`
      : `Digital Procurement (${providerLabel})`;
    const resolvedTrxId = isFree ? 'FREE-ACCESS' : (trxId.trim().toUpperCase() || 'DIRECT-ORDER');

    const orderItemsPayload = checkoutItems.map((item) => ({
      productId: item.product.id,
      slug: item.product.slug,
      title: item.product.title,
      category: item.product.category,
      productType: item.product.productType || inferProductType(item.product),
      format: item.product.format,
      quantity: item.quantity,
      unitPrice: item.product.price,
      lineTotal: item.product.price * item.quantity
    }));

    let syncedToSheet = false;
    try {
      const workspaceToken = getAccessToken() || '';
      const storedSheetId = getStoredShopSheetId() || '';

      const orderRes = await fetch('/api/shop/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(workspaceToken ? { 'x-workspace-token': workspaceToken } : {})
        },
        body: JSON.stringify({
          referenceId: orderNum,
          customerName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          companyName: company.trim() || 'Direct Individual Client',
          items: orderItemsPayload,
          subtotal: orderSubtotal,
          discount: orderDiscount,
          total: orderTotal,
          paymentMethod: methodLabel,
          trxId: resolvedTrxId,
          authProvider: activeProvider,
          status: 'Completed Order',
          workspaceAccessToken: workspaceToken,
          spreadsheetId: storedSheetId
        })
      });

      if (orderRes.ok) {
        const orderData = await orderRes.json();
        syncedToSheet = Boolean(orderData?.sheetSynced);
      }

      if (!syncedToSheet && workspaceToken) {
        const fallbackAppend = await appendShopOrderToSheet(
          {
            referenceId: orderNum,
            customerName: fullName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            companyName: company.trim() || 'Direct Individual Client',
            items: orderItemsPayload,
            subtotal: orderSubtotal,
            discount: orderDiscount,
            total: orderTotal,
            paymentMethod: methodLabel,
            trxId: resolvedTrxId,
            authProvider: activeProvider,
            status: 'Completed Order',
            submittedAt: new Date().toISOString()
          },
          workspaceToken
        );
        syncedToSheet = fallbackAppend.synced;
      }
    } catch {
      // Non-blocking order ledger fallback
    }

    // Automatically trigger Order Confirmation Email with itemized products & total cost
    try {
      const emailConfirmation = await sendShopOrderConfirmationEmail({
        orderId: orderNum,
        customerName: fullName.trim(),
        customerEmail: email.trim().toLowerCase(),
        customerPhone: phone.trim(),
        companyName: company.trim() || 'Direct Individual Client',
        items: orderItemsPayload,
        subtotal: orderSubtotal,
        discount: orderDiscount,
        totalCost: orderTotal,
        paymentMethod: methodLabel,
        trxId: resolvedTrxId,
        authProvider: activeProvider === 'facebook' ? 'facebook' : 'google'
      });
      setOrderEmailResult(emailConfirmation);
    } catch {
      // Non-blocking order confirmation fallback
    }

    setCompletedOrderSnapshot({
      items: orderItemsPayload,
      subtotal: orderSubtotal,
      discount: orderDiscount,
      total: orderTotal,
      paymentMethod: methodLabel,
      trxId: resolvedTrxId
    });
    setCompletedOrderNumber(orderNum);
    setPurchasedProducts(prods);
    setOrderSheetSynced(syncedToSheet);
    prods.forEach((p) =>
      purchaseProduct(p.id, p.title, p.price, methodLabel, 'completed', {
        productSlug: p.slug,
        orderId: orderNum,
        transactionId: resolvedTrxId,
        userIdOverride: authenticatedUid || undefined,
        userEmailOverride: email.trim().toLowerCase(),
        userNameOverride: fullName.trim()
      })
    );
    const paymentUrl = buildPaymentlyUrl({
      amount: orderTotal,
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      company: company.trim(),
      referenceId: orderNum,
      remarks: checkoutItems.map((i) => i.product.title).join(', ')
    });
    setPaymentRedirectUrl(paymentUrl);

    setIsSubmitting(false);
    setIsOrderComplete(true);
    if (!singleProduct) {
      clearCart();
    }

    // Automatically redirect customer to payment gateway (UddoktaPay Sandbox or Paymently)
    if (!isFree) {
      if (selectedGateway === 'uddoktapay') {
        try {
          const res = await initiateUddoktaPayCheckout({
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            amount: orderTotal.toFixed(2),
            currency: 'BDT',
            metadata: {
              invoice_id: orderNum,
              order_id: orderNum,
              flow_type: 'shop_order',
              customer_name: fullName.trim(),
              customer_email: email.trim().toLowerCase(),
              phone: phone.trim(),
              items: orderItemsPayload
            },
            redirectUrl: `${window.location.origin}/extensions/uddoktapay/success`,
            cancelUrl: `${window.location.origin}/gateway/uddoktapay/cancel`
          });

          if (res.status && res.payment_url) {
            savePendingUddoktaCheckout({
              invoiceId: res.invoice_id || orderNum,
              sessionId: orderNum,
              flowType: 'shop_order',
              fullName: fullName.trim(),
              email: email.trim().toLowerCase(),
              phone: phone.trim(),
              amount: orderTotal,
              currency: 'BDT',
              metadata: {
                invoice_id: orderNum,
                order_id: orderNum,
                flow_type: 'shop_order',
                items: orderItemsPayload
              },
              createdAt: new Date().toISOString()
            });
            window.location.href = res.payment_url;
            return;
          }
        } catch (gatewayErr) {
          console.warn('UddoktaPay direct gateway redirect fallback:', gatewayErr);
        }
      }
      navigate(paymentUrl);
    }
  };

  const handleDownloadSimulatedFile = (product: ShopProduct) => {
    const content = `========================================================
ACCOUNTICCA & E-LAWYERS LEGAL & TAX DIGITAL REPOSITORY
========================================================
Product Title: ${product.title}
Product ID: ${product.id}
Format: ${product.format}
Governing Law: ${product.governingLaw || 'Bangladesh Jurisdictional Law'}
Authorized Licensee: ${fullName || 'Registered Purchaser'}
Verified Social Account: ${email} (${activeProvider === 'facebook' ? 'Facebook' : 'Google'} Firebase Auth)
Firebase UID: ${authenticatedUid || 'Verified'}
Order Number: ${completedOrderNumber}
Date of Delivery: ${new Date().toLocaleDateString('en-GB')}

--- OVERVIEW & INSTRUCTIONS ---
${product.fullDescription}

--- WHAT IS INCLUDED ---
${product.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

--- SAMPLE TEXT PREVIEW ---
${product.samplePreviewSnippet || 'Full verified statutory template.'}

For consultation or document customization:
Hotline: +88 01335230170 | support@accounticca.com
Contact & Advisory: https://blog.accounticca.com/contact
========================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${product.slug}-${completedOrderNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <SEO 
        title="Checkout & Digital Procurement | Accounticca" 
        description="Complete your order for statutory tax calculators, legal contract templates, and corporate compliance toolkits." 
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Navigation Breadcrumbs */}
        <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Checkout & Procurement' }]} />

        {/* Top Header */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">
                {isOrderComplete ? 'Order Procurement Complete' : 'Digital Checkout & Procurement Page'}
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {isOrderComplete 
                  ? `Order #${completedOrderNumber} verified. Assets ready for instant download.` 
                  : 'Separate dedicated page for order processing, option selection, and instant file dispatch.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/tools"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Tools</span>
            </Link>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 px-3.5 py-2 rounded-xl border border-emerald-800 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>256-Bit SSL Encrypted</span>
            </div>
          </div>
        </div>

        {/* Body View */}
        {isOrderComplete ? (
          /* Success Screen */
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 shadow-inner">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg">Checkout Successful &amp; Unlocked!</h3>
                  <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
                    Your digital assets have been dispatched to <strong>{email}</strong> and permanently linked to your User ID (<strong>{activeUserId || authenticatedUid || email}</strong>).
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {paymentRedirectUrl && !isFree && (
                  <a
                    href={paymentRedirectUrl}
                    target="_top"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all shrink-0"
                  >
                    <span>Complete Payment on Paymently (BDT {orderTotal.toLocaleString('en-IN')})</span>
                    <ExternalLink className="w-4 h-4 text-slate-950" />
                  </a>
                )}
                <Link
                  to="/client-portal"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md hover:bg-emerald-300 transition-all shrink-0"
                >
                  <span>Go to Dashboard</span>
                  <ExternalLink className="w-4 h-4 text-slate-900" />
                </Link>
                {purchasedProducts[0] && (
                  <Link
                    to={`/shop/${purchasedProducts[0].slug}`}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-white text-emerald-950 font-black text-xs rounded-xl shadow-md hover:bg-emerald-50 transition-all shrink-0"
                  >
                    <Eye className="w-4 h-4 text-emerald-700" />
                    <span>View Product</span>
                  </Link>
                )}
              </div>
            </div>


            {/* Order Confirmation Email Panel */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                      <span>Automated Order Confirmation</span>
                      <span className="text-[11px] font-semibold text-emerald-700">
                        · {completedOrderSnapshot?.items.length || purchasedProducts.length} Item(s) · BDT {(completedOrderSnapshot?.total ?? orderTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {orderEmailResult?.message ||
                        `Order confirmation email generated for ${email} confirming itemized products and total settlement cost.`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowEmailPreview((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{showEmailPreview ? 'Hide Email Preview' : 'View Confirmation Email'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResendConfirmationEmail}
                    disabled={resendingEmail}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{resendingEmail ? 'Sending...' : 'Resend Confirmation'}</span>
                  </button>
                </div>
              </div>

              {showEmailPreview && (
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setEmailPreviewTab('rendered')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                          emailPreviewTab === 'rendered'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Rendered Customer Email
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmailPreviewTab('template')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                          emailPreviewTab === 'template'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        HTML Template
                      </button>
                    </div>

                    {emailPreviewTab === 'template' && (
                      <button
                        type="button"
                        onClick={handleCopyEmailTemplate}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{copiedTemplate ? 'Copied HTML Template!' : 'Copy HTML Template'}</span>
                      </button>
                    )}
                  </div>

                  {emailPreviewTab === 'rendered' ? (
                    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                      <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-slate-900">Subject:</span>{' '}
                          <span>{orderEmailResult?.subject || liveEmailPreview.subject}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          To: <strong className="text-slate-800">{email}</strong>
                        </div>
                      </div>
                      <div
                        className="max-h-[520px] overflow-y-auto"
                        dangerouslySetInnerHTML={{
                          __html: orderEmailResult?.html || liveEmailPreview.html
                        }}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-[11px] text-slate-600">
                        Dynamic variables include{' '}
                        <code className="font-mono text-emerald-700">{'{{order_id}}'}</code>,{' '}
                        <code className="font-mono text-emerald-700">{'{{to_name}}'}</code>,{' '}
                        <code className="font-mono text-emerald-700">{'{{{items_rows_html}}}'}</code>,{' '}
                        <code className="font-mono text-emerald-700">{'{{subtotal_bdt}}'}</code>,{' '}
                        <code className="font-mono text-emerald-700">{'{{discount_bdt}}'}</code>, and{' '}
                        <code className="font-mono text-emerald-700">{'{{total_cost_bdt}}'}</code>.
                      </div>
                      <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto max-h-80 leading-relaxed">
                        {SHOP_ORDER_HTML_TEMPLATE}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Downloads List */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-600" />
                <span>Your Purchased Downloads</span>
              </h3>

              <div className="space-y-3">
                {purchasedProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-5 bg-slate-50 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-emerald-700 shrink-0">
                        <FileCheck2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-extrabold text-base text-slate-900">{p.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Format: {p.format} • {p.pagesOrFiles}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Link
                        to={`/shop/${p.slug}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-black transition-all shadow-xs"
                      >
                        <Eye className="w-4 h-4 text-emerald-600" />
                        <span>View Product</span>
                      </Link>
                      <Link
                        to="/client-portal"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-xs"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Go to Dashboard</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDownloadSimulatedFile(p)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-emerald-400" />
                        <span>Download Kit</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
              <Link
                to="/client-portal"
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black transition-colors"
              >
                Go to Dashboard
              </Link>
              <Link
                to="/tools"
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-colors"
              >
                Explore Compliance Tools
              </Link>
            </div>
          </div>
        ) : checkoutItems.length === 0 && (alreadyPurchasedCheckoutItems.length > 0 || pendingCheckoutItems.length > 0) ? (
          /* Duplicate Purchase Guard Screen */
          <div className="bg-white rounded-3xl p-8 sm:p-10 border-2 border-emerald-200 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-extrabold uppercase tracking-wider mb-2">
                    Duplicate Purchase Prevented
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    You Already Own {alreadyPurchasedCheckoutItems.length === 1 ? 'This Product' : 'These Products'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
                    Verified against User ID <strong className="font-mono text-slate-800">{activeUserId || authenticatedUid || activeUserEmail || 'Active Account'}</strong>. You have full access and do not need to pay again.
                  </p>
                </div>
              </div>
              <Link
                to="/client-portal"
                className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold shadow-md transition-all shrink-0"
              >
                <span>Go to Dashboard</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {[...alreadyPurchasedCheckoutItems, ...pendingCheckoutItems].map(({ product }) => (
                <div
                  key={product.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={product.imageUrl || '/logo.png'}
                      alt={product.title}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{product.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{product.format} • {product.category}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Link
                      to={`/shop/${product.slug}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-extrabold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      <span>View Product</span>
                    </Link>
                    <Link
                      to="/client-portal"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold transition-colors"
                    >
                      <span>Go to Dashboard</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : checkoutItems.length === 0 ? (
          /* Empty Cart/No product selected */
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xl space-y-4">
            <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">No Item Selected for Checkout</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Please select a digital legal kit or tax calculation model from our shop catalog to proceed.
            </p>
            <Link
              to="/tools"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              <span>Explore Compliance Tools</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Form Screen */
          <form
            onSubmit={handleSubmitOrder}
            className="app-form-60 grid grid-cols-1 md:grid-cols-12 gap-8 w-full lg:w-[60vw] mx-auto items-start"
          >
            
            {/* Left Column: Contact & Payment (7 cols) */}
            <div className="md:col-span-7 space-y-6">
              
              {/* Customer Details Box */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <span>Customer &amp; Delivery Details</span>
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleClearCheckoutForm}
                      title="Reset customer fields to default state"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-full border border-rose-200 shrink-0 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear Form</span>
                    </button>
                    {isSocialAuthenticated ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full w-fit">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        Verified via{' '}
                        {activeProvider === 'facebook'
                          ? 'Facebook'
                          : activeProvider === 'google'
                          ? 'Google'
                          : 'Authenticated Session'}
                      </span>
                    </span>
                  ) : isEmailValid ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full w-fit">
                      <Mail className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Delivery Email Ready</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full w-fit">
                      <Mail className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Sign In or Enter Delivery Email</span>
                    </span>
                  )}
                  </div>
                </div>

                {/* Express Social Login Options (Google & Facebook) */}
                <div
                  className={`p-4 rounded-2xl border space-y-3 transition-colors ${
                    isSocialAuthenticated
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {isSocialAuthenticated && (
                        authenticatedPhoto ? (
                          <img
                            src={authenticatedPhoto}
                            alt={fullName || 'Verified User'}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                            {(fullName || email || 'U').charAt(0).toUpperCase()}
                          </div>
                        )
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                          <span>
                            {isSocialAuthenticated
                              ? 'Firebase Authenticated Client Account'
                              : '1-Click Express Auto-Fill (Google or Facebook)'}
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                          {isSocialAuthenticated
                            ? `Signed in as ${email || authUser?.email || user?.email || fullName}. Order confirmation will be emailed to your address below.`
                            : 'Sign in with Google or Facebook to auto-fill your profile, or enter your delivery email and details directly below.'}
                        </p>
                      </div>
                    </div>
                    {isSocialAuthenticated && (
                      <button
                        type="button"
                        onClick={logout}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Sign Out</span>
                      </button>
                    )}
                  </div>

                  {socialError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700 font-medium">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{socialError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={socialLoading !== null}
                      className={`w-full py-3 px-4 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer ${
                        activeProvider === 'google'
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-600/20'
                          : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-300 hover:border-slate-400 ring-1 ring-slate-900/5'
                      } disabled:opacity-60`}
                    >
                      <svg className="w-4 h-4 shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>
                        {socialLoading === 'google'
                          ? 'Connecting Google...'
                          : activeProvider === 'google'
                          ? 'Signed in with Google ✓'
                          : 'Sign in with Google'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleFacebookLogin}
                      disabled={socialLoading !== null}
                      className={`w-full py-3 px-4 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer ${
                        activeProvider === 'facebook'
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-600/20'
                          : 'bg-[#1877F2] hover:bg-[#166FE5] text-white border-[#1877F2]'
                      } disabled:opacity-60`}
                    >
                      <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      <span>
                        {socialLoading === 'facebook'
                          ? 'Connecting Facebook...'
                          : activeProvider === 'facebook'
                          ? 'Signed in with Facebook ✓'
                          : 'Sign in with Facebook'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="relative flex items-center py-0.5">
                  <div className="flex-grow border-t border-slate-200" />
                  <span className="shrink-0 mx-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Client &amp; Delivery Information
                  </span>
                  <div className="flex-grow border-t border-slate-200" />
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <label htmlFor="checkout-full-name" className="text-xs font-bold text-slate-700">
                        Full Name *
                      </label>
                      <FieldTooltip content="Enter the legal name of the purchaser or corporate representative for licensing records." />
                    </div>
                    <input
                      id="checkout-full-name"
                      name="name"
                      autoComplete="name"
                      type="text"
                      inputMode="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <label htmlFor="checkout-email" className="text-xs font-bold text-slate-700">
                            Email Address (Order Receipt &amp; Kit) *
                          </label>
                          <FieldTooltip content="Delivery email address where your order receipt, tax spreadsheets, and digital vouchers are sent." />
                        </div>
                        {isEmailValid && (
                          <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Verified Format
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          id="checkout-email"
                          name="email"
                          autoComplete="email"
                          type="email"
                          inputMode="email"
                          required
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (testEmailFeedback) setTestEmailFeedback(null);
                          }}
                          placeholder="yourname@example.com"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <label htmlFor="checkout-phone" className="text-xs font-bold text-slate-700">
                          Phone / WhatsApp *
                        </label>
                        <FieldTooltip content="Primary phone or WhatsApp number for verification, order status alerts, and client support." />
                      </div>
                      <PatternFormat
                        id="checkout-phone"
                        name="tel"
                        autoComplete="tel"
                        type="tel"
                        inputMode="tel"
                        required
                        format={phone.trim().startsWith('+') ? '+### ####-######' : '#####-######'}
                        mask="_"
                        value={phone}
                        onValueChange={(values) => setPhone(values.formattedValue)}
                        placeholder="01711-XXXXXX"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <label htmlFor="checkout-company" className="text-xs font-bold text-slate-700">
                          Company / Organization <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <FieldTooltip content="Optional enterprise, law chamber, or firm name to display on corporate tax invoices." />
                      </div>
                      <input
                        id="checkout-company"
                        name="organization"
                        autoComplete="organization"
                        type="text"
                        inputMode="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g. Apex Tech Ventures Ltd."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <label htmlFor="checkout-tin" className="text-xs font-bold text-slate-700">
                          Tax Identification Number (e-TIN) <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <FieldTooltip content="12-digit e-TIN or VAT BIN to print on statutory tax invoices and official accounting vouchers." />
                      </div>
                      <PatternFormat
                        id="checkout-tin"
                        name="tin"
                        autoComplete="on"
                        type="text"
                        inputMode="numeric"
                        format="####-####-####"
                        mask="_"
                        value={tin}
                        onValueChange={(values) => setTin(values.formattedValue)}
                        placeholder="4829-1028-3401"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  {/* Instant Order Confirmation Email Delivery Bar */}
                  <div className="hidden p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-emerald-950 flex flex-wrap items-center gap-1.5">
                            <span>Automated Order Confirmation Email</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-800 font-bold">
                              SMTP Active
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800 mt-0.5 truncate">
                            {isEmailValid
                              ? `Receipt for ${checkoutItems.length} item(s) (BDT ${orderTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) will be sent to ${email.trim().toLowerCase()}`
                              : 'Enter your email address above to receive your itemized order confirmation & download links.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleSendTestOrderEmail}
                          disabled={testEmailSending || !isEmailValid}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[11px] font-extrabold transition-colors cursor-pointer shadow-2xs"
                        >
                          <Send className="w-3 h-3" />
                          <span>{testEmailSending ? 'Sending...' : 'Send Confirmation Mail'}</span>
                        </button>
                      </div>
                    </div>

                    {testEmailFeedback && (
                      <div
                        className={`p-2.5 rounded-xl border text-[11px] font-semibold flex flex-wrap items-center justify-between gap-2 ${
                          testEmailFeedback.type === 'success'
                            ? 'bg-white border-emerald-300 text-emerald-900'
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {testEmailFeedback.type === 'success' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          )}
                          <span>{testEmailFeedback.text}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowEmailPreview(true);
                              setEmailPreviewTab('rendered');
                            }}
                            className="underline font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                          >
                            View Sent Email
                          </button>
                          {testEmailFeedback.previewUrl && (
                            <a
                              href={testEmailFeedback.previewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold hover:bg-emerald-200"
                            >
                              <span>SMTP Inbox</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Summary & Confirmation (5 cols) */}
            <div className="md:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center justify-between">
                  <span>Order Summary</span>
                  <span className="text-xs text-slate-500 font-bold">{checkoutItems.length} items</span>
                </h2>

                {/* Items List */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {checkoutItems.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 text-xs p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <img
                        src={item.product.imageUrl || '/logo.png'}
                        alt={item.product.title}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 truncate">{item.product.title}</div>
                        <div className="text-[10px] text-slate-500">Format: {item.product.format} • Qty: {item.quantity}</div>
                      </div>
                      <div className="font-black text-slate-900 shrink-0 text-sm">
                        BDT {(item.product.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing Breakdown */}
                <div className="pt-4 border-t border-slate-200 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal Amount:</span>
                    <span 
                      className="font-bold text-slate-900 text-[10px]"
                      style={{ fontSize: '10px' }}
                    >
                      BDT {orderSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {orderDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Discount Savings:</span>
                      <span>-BDT {orderDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1">
                    <span>Confirmation Email:</span>
                    {isEmailValid ? (
                      <span className="font-extrabold text-emerald-700 truncate max-w-[180px]">
                        {email.trim().toLowerCase()}
                      </span>
                    ) : (
                      <span className="font-extrabold text-amber-700">
                        Enter Email Address
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-200">
                    <span>Total Due:</span>
                    <span className="text-lg text-emerald-700 font-black">
                      BDT {orderTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Payment Gateway Channel Selector */}
                {!isFree && (
                  <div className="pt-2 space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
                      Select Payment Gateway
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedGateway('uddoktapay')}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          selectedGateway === 'uddoktapay'
                            ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-2xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>UddoktaPay</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-extrabold uppercase">Automated</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            bKash, Nagad, Rocket, Cards
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selectedGateway === 'uddoktapay' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                        }`}>
                          {selectedGateway === 'uddoktapay' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedGateway('paymently')}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          selectedGateway === 'paymently'
                            ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-2xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>Paymently</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-extrabold uppercase">Link</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            Hosted Link &amp; Manual MFS
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selectedGateway === 'paymently' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                        }`}>
                          {selectedGateway === 'paymently' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Terms Agreement */}
                <div className="pt-2 space-y-4">
                  <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>
                      I verify my contact details are correct and agree to the digital procurement terms &amp; conditions.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmitting || !agreeTerms || checkoutItems.length === 0}
                    className="w-full py-4 px-5 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 hover:from-emerald-800 hover:to-teal-900 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg hover:shadow-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer group"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2 font-bold normal-case text-sm">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                        <span>Redirecting to {selectedGateway === 'uddoktapay' ? 'UddoktaPay' : 'Paymently'} Gateway (BDT {orderTotal.toLocaleString('en-IN')})...</span>
                      </span>
                    ) : (
                      <>
                        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm">
                          <Lock className="w-4 h-4 text-emerald-200" />
                          <span>
                            {isFree 
                              ? 'Confirm Order • Free (BDT 0.00)' 
                              : `Confirm Order & Pay BDT ${orderTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          </span>
                          <ExternalLink className="w-4 h-4 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                        {!isFree && (
                          <span className="text-[10px] font-bold text-emerald-100/90 tracking-normal normal-case flex items-center gap-1.5">
                            <span>
                              {selectedGateway === 'uddoktapay'
                                ? 'Redirects to UddoktaPay Sandbox (bKash, Nagad, Rocket, Cards)'
                                : 'Redirects to Paymently with name, email & mobile auto-filled'}
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                          </span>
                        )}
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      {selectedGateway === 'uddoktapay'
                        ? 'Automated MFS & Card settlement via UddoktaPay Sandbox Gateway'
                        : 'Instant auto-fill via Paymently BDT Gateway (https://elawyers.paymently.io)'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Order Confirmation Template Inspector & Live Preview */}
              <div className="hidden bg-white rounded-3xl p-6 border border-slate-200 shadow-lg space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-900">
                        Automated Order Confirmation
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Triggers automatically on submission to confirm your {checkoutItems.length} item(s) and{' '}
                        <strong className="text-slate-800">BDT {orderTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> total cost.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEmailPreview((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition-colors shrink-0 cursor-pointer"
                  >
                    <Code2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{showEmailPreview ? 'Hide Template' : 'Preview Template'}</span>
                  </button>
                </div>

                {showEmailPreview && (
                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setEmailPreviewTab('rendered')}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                            emailPreviewTab === 'rendered'
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Live Email Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmailPreviewTab('template')}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                            emailPreviewTab === 'template'
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          HTML Source
                        </button>
                      </div>

                      {emailPreviewTab === 'template' && (
                        <button
                          type="button"
                          onClick={handleCopyEmailTemplate}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          <Copy className="w-3 h-3 text-emerald-400" />
                          <span>{copiedTemplate ? 'Copied!' : 'Copy HTML'}</span>
                        </button>
                      )}
                    </div>

                    {emailPreviewTab === 'rendered' ? (
                      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 truncate">
                          <strong className="text-slate-900">Subject:</strong> {liveEmailPreview.subject}
                        </div>
                        <div
                          className="max-h-96 overflow-y-auto"
                          dangerouslySetInnerHTML={{ __html: liveEmailPreview.html }}
                        />
                      </div>
                    ) : (
                      <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 text-[10px] font-mono overflow-x-auto max-h-72 leading-relaxed">
                        {SHOP_ORDER_HTML_TEMPLATE}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
