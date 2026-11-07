import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  CreditCard,
  Building2,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  User as UserIcon,
  ShoppingBag,
  HelpCircle,
  Receipt,
  FileText,
  RefreshCw,
  RotateCcw,
  Globe,
  SlidersHorizontal,
  Loader2,
  QrCode
} from 'lucide-react';
import { z } from 'zod';
import { PatternFormat } from 'react-number-format';
import { useDebounce, useDebouncedZodValidation } from '../hooks/useDebounce';
import { SEO } from '../components/SEO';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useCart } from '../contexts/CartContext';
import { usePurchases } from '../contexts/PurchaseContext';
import { useAuth } from '../contexts/AuthContext';
import { SHOP_PRODUCTS, ShopProduct } from '../data/shopProducts';
import { savePendingUddoktaCheckout } from '../services/uddoktapayService';
import { dispatchFormSubmissionToast } from '../components/ui/FormSubmissionToast';
import { FieldTooltip } from '../components/ui/FieldTooltip';

type PaymentChannel = 'bkash' | 'nagad' | 'rocket' | 'card';

// ==========================================
// ZOD VALIDATION SCHEMAS FOR FORM CONTAINER
// ==========================================

export const paymentSettlementSchema = z
  .object({
    clientName: z
      .string()
      .trim()
      .min(2, 'Client name must be at least 2 characters long.'),
    clientEmail: z
      .string()
      .trim()
      .min(1, 'Email address is required for license delivery.')
      .email('Please enter a valid email format (e.g. name@domain.com).'),
    clientPhone: z
      .string()
      .transform((val) => val.replace(/[_-\s()]/g, '').trim())
      .refine((val) => val.length >= 6, 'Please enter a valid mobile number (minimum 6 digits).')
      .refine((val) => /^[+0-9]{6,20}$/.test(val), 'Mobile number may only contain digits and "+".'),
    amount: z
      .number()
      .positive('Payable amount must be a positive number greater than 0 BDT.')
      .min(1, 'Minimum payable amount is 1 BDT.'),
    referenceId: z
      .string()
      .trim()
      .min(3, 'Reference / Invoice ID must be at least 3 characters.'),
    remarks: z.string().optional(),
    activeChannel: z.enum(['bkash', 'nagad', 'rocket', 'card']),
    trxId: z.string().optional(),
    cardNumber: z.string().optional(),
    cardExpiry: z.string().optional(),
    cardCvc: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.activeChannel !== 'card') {
      const cleanTrx = (data.trxId || '').trim();
      if (!cleanTrx) {
        ctx.addIssue({
          code: 'custom',
          path: ['trxId'],
          message: `Please enter your ${data.activeChannel.toUpperCase()} Transaction ID (TrxID) or click Auto-Fill Demo TrxID.`
        });
      } else if (cleanTrx.length < 4) {
        ctx.addIssue({
          code: 'custom',
          path: ['trxId'],
          message: 'Transaction ID must be at least 4 alphanumeric characters.'
        });
      }
    } else {
      const cleanCard = (data.cardNumber || '').replace(/[\s_]+/g, '');
      if (!cleanCard || cleanCard.length < 12) {
        ctx.addIssue({
          code: 'custom',
          path: ['cardNumber'],
          message: 'Please enter a valid card number (at least 12 digits).'
        });
      }
      const cleanExpiry = (data.cardExpiry || '').replace(/[MY\s_]+/g, '').trim();
      if (!cleanExpiry || !/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(cleanExpiry)) {
        ctx.addIssue({
          code: 'custom',
          path: ['cardExpiry'],
          message: 'Please enter a valid card expiry date in MM/YY format.'
        });
      }
      if (!data.cardCvc || data.cardCvc.trim().length < 3) {
        ctx.addIssue({
          code: 'custom',
          path: ['cardCvc'],
          message: 'Please enter a valid 3 or 4-digit CVV / CVC code.'
        });
      }
    }
  });

export type PaymentSettlementFormData = z.infer<typeof paymentSettlementSchema>;

export const inboxParamsSchema = z.object({
  clientName: z.string().trim().min(2, 'Client name must be at least 2 characters.').optional().or(z.literal('')),
  clientEmail: z.string().trim().min(1, 'Email is required.').email('Please provide a valid email format (e.g. name@domain.com).'),
  clientPhone: z.string().trim().min(6, 'Mobile number must be at least 6 digits.').optional().or(z.literal('')),
  amount: z.number().positive('Payable amount must be greater than 0 BDT.'),
  referenceId: z.string().trim().min(2, 'Reference ID must be at least 2 characters.').optional().or(z.literal('')),
  remarks: z.string().optional()
});

export function PaymentlyGatewayPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { items: cartItems, subtotal: cartSubtotal, total: cartTotal } = useCart();
  const { purchaseProduct } = usePurchases();
  const { user, authUser } = useAuth();

  // 1. URL Query Extraction with comprehensive aliases
  const queryAmount = searchParams.get('amount') || searchParams.get('total') || '';
  const queryName =
    searchParams.get('name') ||
    searchParams.get('full_name') ||
    searchParams.get('customer_name') ||
    searchParams.get('client_name') ||
    '';
  const queryEmail =
    searchParams.get('email') ||
    searchParams.get('customer_email') ||
    searchParams.get('mail') ||
    '';
  const queryPhone =
    searchParams.get('phone') ||
    searchParams.get('mobile') ||
    searchParams.get('mobile_number') ||
    searchParams.get('customer_phone') ||
    '';
  const queryRef =
    searchParams.get('reference') ||
    searchParams.get('reference_id') ||
    searchParams.get('order_id') ||
    searchParams.get('orderId') ||
    '';
  const queryProduct =
    searchParams.get('product') ||
    searchParams.get('slug') ||
    searchParams.get('title') ||
    '';
  const queryRemarks =
    searchParams.get('remarks') ||
    searchParams.get('description') ||
    searchParams.get('note') ||
    '';

  // 2. Resolve default product context
  const targetProduct: ShopProduct | null = useMemo(() => {
    if (queryProduct) {
      const match = SHOP_PRODUCTS.find(
        (p) => p.slug === queryProduct || p.id === queryProduct || p.title.toLowerCase().includes(queryProduct.toLowerCase())
      );
      if (match) return match;
    }
    if (cartItems.length > 0) {
      return cartItems[0].product;
    }
    return SHOP_PRODUCTS[0] || null;
  }, [queryProduct, cartItems]);

  // 3. Resolve initial values with cascading priority
  const defaultAmount = useMemo(() => {
    if (queryAmount && !isNaN(Number(queryAmount))) {
      return Number(queryAmount);
    }
    if (cartTotal > 0) {
      return cartTotal;
    }
    if (targetProduct) {
      return targetProduct.price;
    }
    return 850;
  }, [queryAmount, cartTotal, targetProduct]);

  const defaultReference = useMemo(() => {
    if (queryRef) return queryRef;
    return `PAY-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  }, [queryRef]);

  // 4. Form state for the inboxes
  const [clientName, setClientName] = useState(queryName);
  const [clientEmail, setClientEmail] = useState(queryEmail);
  const [clientPhone, setClientPhone] = useState(queryPhone);
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [referenceId, setReferenceId] = useState(defaultReference);
  const [remarks, setRemarks] = useState(queryRemarks || targetProduct?.title || 'Legal & Tax Statutory Toolkit');

  // Channel & Transaction state
  const [activeChannel, setActiveChannel] = useState<PaymentChannel>('bkash');
  const [trxId, setTrxId] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  // Card details state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Validation state & helpers for manual editor (debounced by 300ms to prevent excessive Zod re-runs while typing)
  const [emailTouched, setEmailTouched] = useState(false);
  const [amountTouched, setAmountTouched] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const debouncedClientEmail = useDebounce(clientEmail, 300);
  const debouncedAmount = useDebounce(amount, 300);

  const { fieldErrors: debouncedFieldErrors, isDebouncing } = useDebouncedZodValidation(
    paymentSettlementSchema,
    {
      clientName,
      clientEmail,
      clientPhone,
      amount,
      referenceId,
      remarks,
      activeChannel,
      trxId,
      cardNumber,
      cardExpiry,
      cardCvc
    },
    300
  );

  const isEmailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(debouncedClientEmail.trim());
  }, [debouncedClientEmail]);

  const emailError = useMemo(() => {
    if (!debouncedClientEmail.trim()) {
      return 'Email address is required for payment voucher and download access.';
    }
    if (!isEmailValid) {
      return debouncedFieldErrors.clientEmail || 'Please enter a valid email format (e.g. name@domain.com).';
    }
    return null;
  }, [debouncedClientEmail, isEmailValid, debouncedFieldErrors.clientEmail]);

  const showEmailError = emailTouched && !isDebouncing && Boolean(emailError);

  const isAmountValid = useMemo(() => {
    return typeof debouncedAmount === 'number' && !isNaN(debouncedAmount) && debouncedAmount > 0;
  }, [debouncedAmount]);

  const amountError = useMemo(() => {
    if (debouncedAmount === undefined || debouncedAmount === null || isNaN(debouncedAmount) || debouncedAmount <= 0) {
      return debouncedFieldErrors.amount || 'Payable amount must be a positive number greater than 0 BDT.';
    }
    return null;
  }, [debouncedAmount, debouncedFieldErrors.amount]);

  const showAmountError = amountTouched && !isDebouncing && Boolean(amountError);

  // Auto-fill from active auth user if fields are empty
  useEffect(() => {
    if (authUser || user) {
      const authDisplayName = authUser?.displayName || user?.displayName || '';
      const authEmailAddr = authUser?.email || user?.email || '';
      const authPhoneNum = user?.phoneNumber || '';

      if (!clientName && authDisplayName) setClientName(authDisplayName);
      if (!clientEmail && authEmailAddr) setClientEmail(authEmailAddr);
      if (!clientPhone && authPhoneNum) setClientPhone(authPhoneNum);
      if (!senderPhone && authPhoneNum) setSenderPhone(authPhoneNum);
    }
  }, [authUser, user, clientName, clientEmail, clientPhone, senderPhone]);

  // Sync state if query parameters change or are provided
  useEffect(() => {
    if (queryName) setClientName(queryName);
    if (queryEmail) setClientEmail(queryEmail);
    if (queryPhone) setClientPhone(queryPhone);
    if (queryAmount && !isNaN(Number(queryAmount))) setAmount(Number(queryAmount));
    if (queryRef) setReferenceId(queryRef);
    if (queryRemarks) setRemarks(queryRemarks);
  }, [queryName, queryEmail, queryPhone, queryAmount, queryRef, queryRemarks]);

  // Active Tab: 'iframe' (Embedded Paymently Portal) vs 'direct_mfs' (MFS Numbers & TrxID Settlement)
  const [activeTab, setActiveTab] = useState<'iframe' | 'direct_mfs'>('iframe');
  
  // Paymently Iframe Source URL state & loading indicator
  const initialGatewayUrl = useMemo(() => {
    const baseUrl = 'https://elawyers.paymently.io/paymentlink/default/BDT';
    const params = new URLSearchParams();
    if (defaultAmount) params.set('amount', defaultAmount.toString());
    if (clientName) params.set('name', clientName);
    if (clientEmail) params.set('email', clientEmail);
    if (clientPhone) params.set('mobile', clientPhone);
    if (defaultReference) params.set('reference', defaultReference);
    if (remarks) params.set('remarks', remarks);
    const qs = params.toString();
    return qs ? `${baseUrl}?${qs}` : baseUrl;
  }, [defaultAmount, clientName, clientEmail, clientPhone, defaultReference, remarks]);

  const [iframeSrc, setIframeSrc] = useState<string>(initialGatewayUrl);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [iframeLoading, setIframeLoading] = useState<boolean>(true);
  const [iframeLoadTimeout, setIframeLoadTimeout] = useState<boolean>(false);
  const [showParamEditor, setShowParamEditor] = useState<boolean>(false);

  // Dynamic QR Code generator state & official Paymently link QR asset
  const OFFICIAL_PAYMENTLY_QR_IMAGE = '/assets/aistudio/payment-link-BDT-2026-11-01_95a7a326.png';
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [officialQrCodeDataUrl, setOfficialQrCodeDataUrl] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [qrTab, setQrTab] = useState<'dynamic' | 'official'>('dynamic');

  useEffect(() => {
    // Generate official payment link QR code
    QRCode.toDataURL('https://elawyers.paymently.io/paymentlink/default/BDT', {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((url) => setOfficialQrCodeDataUrl(url))
      .catch((err) => console.error('Official QR code generation error:', err));
  }, []);

  useEffect(() => {
    const qrPayload = JSON.stringify({
      gateway: 'Paymently BDT',
      url: iframeSrc || 'https://elawyers.paymently.io/paymentlink/default/BDT',
      reference: referenceId,
      amount: amount,
      currency: 'BDT',
      customer: clientName || queryName || 'Valued Client',
      timestamp: new Date().toISOString()
    });

    QRCode.toDataURL(qrPayload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, [iframeSrc, referenceId, amount, clientName, queryName]);

  // Fallback timer if cross-origin iframe load event is delayed
  useEffect(() => {
    let timer: any;
    if (iframeLoading) {
      setIframeLoadTimeout(false);
      timer = setTimeout(() => {
        setIframeLoadTimeout(true);
      }, 9000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [iframeLoading, iframeKey]);

  // Parse URL parameters (name, email, mobile, amount) and automatically inject them into the Paymently iframe source URL upon mounting
  useEffect(() => {
    // 1. Parse URL parameters (name, email, mobile, amount) with comprehensive fallback aliases
    const parsedAmount =
      searchParams.get('amount') ||
      searchParams.get('total') ||
      (cartTotal > 0 ? cartTotal.toString() : targetProduct ? targetProduct.price.toString() : '850');

    const parsedName =
      searchParams.get('name') ||
      searchParams.get('full_name') ||
      searchParams.get('client_name') ||
      searchParams.get('customer_name') ||
      authUser?.displayName ||
      user?.displayName ||
      '';

    const parsedEmail =
      searchParams.get('email') ||
      searchParams.get('customer_email') ||
      searchParams.get('mail') ||
      authUser?.email ||
      user?.email ||
      '';

    const parsedMobile =
      searchParams.get('mobile') ||
      searchParams.get('phone') ||
      searchParams.get('mobile_number') ||
      searchParams.get('customer_phone') ||
      user?.phoneNumber ||
      '';

    const parsedReference =
      searchParams.get('reference') ||
      searchParams.get('reference_id') ||
      searchParams.get('order_id') ||
      defaultReference;

    const parsedRemarks =
      searchParams.get('remarks') ||
      searchParams.get('description') ||
      searchParams.get('note') ||
      targetProduct?.title ||
      '';

    // 2. Automatically inject parameters into the Paymently iframe source URL upon mounting
    const baseUrl = 'https://elawyers.paymently.io/paymentlink/default/BDT';
    const params = new URLSearchParams();

    if (parsedAmount) {
      params.set('amount', parsedAmount);
    }
    if (parsedName) {
      params.set('name', parsedName);
      params.set('full_name', parsedName);
      params.set('client_name', parsedName);
    }
    if (parsedEmail) {
      params.set('email', parsedEmail);
      params.set('customer_email', parsedEmail);
      params.set('mail', parsedEmail);
    }
    if (parsedMobile) {
      params.set('mobile', parsedMobile);
      params.set('phone', parsedMobile);
      params.set('mobile_number', parsedMobile);
    }
    if (parsedReference) {
      params.set('reference', parsedReference);
      params.set('reference_id', parsedReference);
      params.set('order_id', parsedReference);
    }
    if (parsedRemarks) {
      params.set('remarks', parsedRemarks);
      params.set('description', parsedRemarks);
    }

    const injectedUrl = `${baseUrl}?${params.toString()}`;
    setIframeSrc(injectedUrl);
    setIframeLoading(true);
  }, [searchParams, authUser, user, cartTotal, defaultReference, targetProduct]);

  // Synchronize iframe source URL whenever the inboxes are modified (enforcing Zod schema validation)
  const updateIframeFromInputs = () => {
    setEmailTouched(true);
    setAmountTouched(true);

    const validationResult = inboxParamsSchema.safeParse({
      clientName,
      clientEmail,
      clientPhone,
      amount,
      referenceId,
      remarks
    });

    if (!validationResult.success) {
      const fieldErrorsMap: Record<string, string> = {};
      validationResult.error.issues.forEach((err) => {
        const fieldName = err.path[0]?.toString() || 'general';
        if (!fieldErrorsMap[fieldName]) {
          fieldErrorsMap[fieldName] = err.message;
        }
      });
      setFormErrors(fieldErrorsMap);
      const firstMsg = validationResult.error.issues[0]?.message || 'Please correct the highlighted form errors before updating.';
      setErrorMessage(firstMsg);
      dispatchFormSubmissionToast({
        title: 'Validation Error',
        message: firstMsg,
        type: 'error'
      });
      return;
    }

    setFormErrors({});
    setErrorMessage(null);
    const baseUrl = 'https://elawyers.paymently.io/paymentlink/default/BDT';
    const params = new URLSearchParams();
    if (amount > 0) params.set('amount', amount.toString());
    if (clientName) {
      params.set('name', clientName);
      params.set('full_name', clientName);
      params.set('client_name', clientName);
    }
    if (clientEmail) {
      params.set('email', clientEmail);
      params.set('customer_email', clientEmail);
      params.set('mail', clientEmail);
    }
    if (clientPhone) {
      params.set('mobile', clientPhone);
      params.set('phone', clientPhone);
      params.set('mobile_number', clientPhone);
    }
    if (referenceId) {
      params.set('reference', referenceId);
      params.set('reference_id', referenceId);
      params.set('order_id', referenceId);
    }
    if (remarks) {
      params.set('remarks', remarks);
      params.set('description', remarks);
    }
    setIframeSrc(`${baseUrl}?${params.toString()}`);
    setIframeLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  // Reset all manual form inputs to their initial default state
  const handleClearForm = () => {
    const initialName = queryName || authUser?.displayName || user?.displayName || '';
    const initialEmail = queryEmail || authUser?.email || user?.email || '';
    const initialPhone = queryPhone || '';
    const initialAmount = defaultAmount;
    const initialRef = defaultReference;
    const initialRemarks = queryRemarks || targetProduct?.title || 'Legal & Tax Statutory Toolkit';

    setClientName(initialName);
    setClientEmail(initialEmail);
    setClientPhone(initialPhone);
    setAmount(initialAmount);
    setReferenceId(initialRef);
    setRemarks(initialRemarks);
    setActiveChannel('bkash');
    setTrxId('');
    setSenderPhone('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvc('');
    setEmailTouched(false);
    setAmountTouched(false);
    setErrorMessage(null);
    setFormErrors({});
    setCopiedNumber(null);

    // Also synchronize the iframe source URL back to default values
    const baseUrl = 'https://elawyers.paymently.io/paymentlink/default/BDT';
    const params = new URLSearchParams();
    if (initialAmount > 0) params.set('amount', initialAmount.toString());
    if (initialName) {
      params.set('name', initialName);
      params.set('full_name', initialName);
      params.set('client_name', initialName);
    }
    if (initialEmail) {
      params.set('email', initialEmail);
      params.set('customer_email', initialEmail);
      params.set('mail', initialEmail);
    }
    if (initialPhone) {
      params.set('mobile', initialPhone);
      params.set('phone', initialPhone);
      params.set('mobile_number', initialPhone);
    }
    if (initialRef) {
      params.set('reference', initialRef);
      params.set('reference_id', initialRef);
      params.set('order_id', initialRef);
    }
    if (initialRemarks) {
      params.set('remarks', initialRemarks);
      params.set('description', initialRemarks);
    }
    setIframeSrc(`${baseUrl}?${params.toString()}`);
    setIframeLoading(true);
    setIframeKey((prev) => prev + 1);

    dispatchFormSubmissionToast({
      title: 'Form Reset to Defaults',
      message: 'All payment fields have been restored to their default state.',
      type: 'info'
    });
  };

  // External live link generator
  const externalPaymentlyUrl = useMemo(() => {
    return iframeSrc || 'https://elawyers.paymently.io/paymentlink/default/BDT';
  }, [iframeSrc]);

  const handleCopy = (val: string, label: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(val);
      setCopiedNumber(label);
      setTimeout(() => setCopiedNumber(null), 2000);
    }
  };

  const handleSimulateTrx = () => {
    const randomTrx = `8${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    setTrxId(randomTrx);
    if (!senderPhone) {
      setSenderPhone(clientPhone || '01711223344');
    }
    setErrorMessage(null);
    if (formErrors.trxId) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.trxId;
        return next;
      });
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setAmountTouched(true);
    setErrorMessage(null);

    // Validate manual settlement form using Zod schema to ensure strict data integrity
    const validationResult = paymentSettlementSchema.safeParse({
      clientName,
      clientEmail,
      clientPhone,
      amount,
      referenceId,
      remarks,
      activeChannel,
      trxId,
      cardNumber,
      cardExpiry,
      cardCvc
    });

    if (!validationResult.success) {
      const fieldErrorsMap: Record<string, string> = {};
      validationResult.error.issues.forEach((err) => {
        const fieldName = err.path[0]?.toString() || 'general';
        if (!fieldErrorsMap[fieldName]) {
          fieldErrorsMap[fieldName] = err.message;
        }
      });
      setFormErrors(fieldErrorsMap);
      const firstMsg = validationResult.error.issues[0]?.message || 'Please check highlighted form fields.';
      setErrorMessage(firstMsg);
      dispatchFormSubmissionToast({
        title: 'Validation Error',
        message: firstMsg,
        type: 'error'
      });
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    try {
      const resolvedTrx = trxId.trim().toUpperCase() || `CARD-${Date.now().toString().slice(-8)}`;
      const channelLabel =
        activeChannel === 'bkash'
          ? 'bKash Personal'
          : activeChannel === 'nagad'
          ? 'Nagad MFS'
          : activeChannel === 'rocket'
          ? 'DBBL Rocket'
          : 'Card Paymently';

      // 1. Prepare items payload
      const orderItems =
        cartItems.length > 0
          ? cartItems.map((ci) => ({
              id: ci.product.id,
              productId: ci.product.id,
              slug: ci.product.slug,
              title: ci.product.title,
              price: ci.product.price,
              quantity: ci.quantity
            }))
          : [
              {
                id: targetProduct?.id || 'income-tax-calculator-2026-27',
                productId: targetProduct?.id || 'income-tax-calculator-2026-27',
                slug: targetProduct?.slug || 'income-tax-calculator-2026-27',
                title: remarks || targetProduct?.title || 'Statutory Tax & Legal Toolkit',
                price: amount,
                quantity: 1
              }
            ];

      // 2. Record purchased products in context
      orderItems.forEach((item) => {
        purchaseProduct(item.id, item.title, item.price, `Paymently (${channelLabel})`, 'completed', {
          productSlug: item.slug,
          orderId: referenceId,
          transactionId: resolvedTrx,
          userEmailOverride: clientEmail.trim().toLowerCase(),
          userNameOverride: clientName.trim()
        });
      });

      // 3. Save pending verification snapshot for /payment/verify
      savePendingUddoktaCheckout({
        invoiceId: referenceId,
        sessionId: referenceId,
        amount: amount,
        currency: 'BDT',
        fullName: clientName.trim(),
        email: clientEmail.trim().toLowerCase(),
        phone: clientPhone.trim(),
        flowType: 'shop_order',
        metadata: {
          flow_type: 'shop_order',
          invoice_id: referenceId,
          order_id: referenceId,
          transaction_id: resolvedTrx,
          payment_method: channelLabel,
          items: orderItems,
          customer_name: clientName.trim(),
          customer_email: clientEmail.trim().toLowerCase(),
          customer_phone: clientPhone.trim()
        },
        createdAt: new Date().toISOString()
      });

      // 4. Record to Firestore / backend contact ledger if available
      try {
        await fetch('/api/shop/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referenceId,
            customerName: clientName.trim(),
            email: clientEmail.trim().toLowerCase(),
            phone: clientPhone.trim(),
            companyName: 'Paymently BDT Direct Settlement',
            items: orderItems,
            subtotal: amount,
            discount: 0,
            total: amount,
            paymentMethod: `Paymently (${channelLabel})`,
            trxId: resolvedTrx,
            authProvider: 'paymently_gateway',
            status: 'Completed Order'
          })
        });
      } catch {
        // Non-blocking ledger save
      }

      dispatchFormSubmissionToast({
        title: 'Payment Settlement Completed',
        message: `Reference ${referenceId} verified via Paymently ${channelLabel}.`,
        type: 'success'
      });

      // 5. Broadcast payment success to other open tabs (e.g. checkout page)
      try {
        if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
          const paymentChannel = new BroadcastChannel('accounticca_payment_sync');
          paymentChannel.postMessage({
            type: 'PAYMENT_COMPLETED',
            referenceId,
            amount,
            status: 'completed',
            timestamp: Date.now()
          });
          paymentChannel.close();
        }
      } catch (bcErr) {
        console.warn('BroadcastChannel notice:', bcErr);
      }

      // 6. Seamlessly redirect to the official verification & download page
      setTimeout(() => {
        navigate(
          `/payment/verify?invoice_id=${encodeURIComponent(referenceId)}&amount=${encodeURIComponent(
            amount
          )}&flow=shop_order&status=completed`
        );
      }, 350);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Payment settlement encountered an error. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleIframeCompleted = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const resolvedTrx = `PAYLY-${Date.now().toString().slice(-8)}`;
      const orderItems =
        cartItems.length > 0
          ? cartItems.map((ci) => ({
              id: ci.product.id,
              productId: ci.product.id,
              slug: ci.product.slug,
              title: ci.product.title,
              price: ci.product.price,
              quantity: ci.quantity
            }))
          : [
              {
                id: targetProduct?.id || 'income-tax-calculator-2026-27',
                productId: targetProduct?.id || 'income-tax-calculator-2026-27',
                slug: targetProduct?.slug || 'income-tax-calculator-2026-27',
                title: remarks || targetProduct?.title || 'Legal & Tax Statutory Toolkit',
                price: amount,
                quantity: 1
              }
            ];

      orderItems.forEach((item) => {
        purchaseProduct(item.productId, item.title, item.price, 'Paymently Hosted Gateway (iframe)', 'completed', {
          productSlug: item.slug,
          orderId: referenceId,
          transactionId: resolvedTrx,
          userEmailOverride: clientEmail.trim().toLowerCase(),
          userNameOverride: clientName.trim()
        });
      });

      savePendingUddoktaCheckout({
        invoiceId: referenceId,
        sessionId: referenceId,
        amount: amount,
        currency: 'BDT',
        fullName: clientName.trim() || 'Valued Client',
        email: clientEmail.trim().toLowerCase() || 'client@example.com',
        phone: clientPhone.trim() || 'N/A',
        flowType: 'shop_order',
        metadata: {
          flow_type: 'shop_order',
          invoice_id: referenceId,
          order_id: referenceId,
          transaction_id: resolvedTrx,
          payment_method: 'Paymently Hosted Gateway (iframe)',
          items: orderItems,
          customer_name: clientName.trim(),
          customer_email: clientEmail.trim().toLowerCase(),
          customer_phone: clientPhone.trim()
        },
        createdAt: new Date().toISOString()
      });

      try {
        await fetch('/api/shop/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referenceId,
            customerName: clientName.trim(),
            email: clientEmail.trim().toLowerCase(),
            phone: clientPhone.trim(),
            companyName: 'Paymently BDT Direct Settlement',
            items: orderItems,
            subtotal: amount,
            discount: 0,
            total: amount,
            paymentMethod: 'Paymently Hosted Gateway (iframe)',
            trxId: resolvedTrx,
            authProvider: 'paymently_gateway',
            status: 'Completed Order'
          })
        });
      } catch {
        // Non-blocking
      }

      dispatchFormSubmissionToast({
        title: 'Settlement Confirmed',
        message: `Reference ${referenceId} verified via Paymently. Unlocking assets...`,
        type: 'success'
      });

      try {
        if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
          const paymentChannel = new BroadcastChannel('accounticca_payment_sync');
          paymentChannel.postMessage({
            type: 'PAYMENT_COMPLETED',
            referenceId,
            amount,
            status: 'completed',
            timestamp: Date.now()
          });
          paymentChannel.close();
        }
      } catch (bcErr) {
        console.warn('BroadcastChannel notice:', bcErr);
      }

      setTimeout(() => {
        navigate(
          `/payment/verify?invoice_id=${encodeURIComponent(referenceId)}&amount=${encodeURIComponent(
            amount
          )}&flow=shop_order&status=completed`
        );
      }, 350);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Verification could not proceed.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 text-slate-900">
      <SEO
        title="Paymently BDT Gateway | Accounticca & E-Lawyers Chambers"
        description="Official Paymently Bangladeshi Taka (BDT) settlement link for verified legal, tax, and compliance toolkit procurement."
        canonicalUrl="/paymently"
      />

      <div className="max-w-6xl mx-auto space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Tools', path: '/tools' },
            { label: 'Checkout', path: '/checkout' },
            { label: 'Paymently Gateway' }
          ]}
        />

        {/* Branded Header */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20 shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-emerald-400">
                <Lock className="w-7 h-7" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                  Paymently BDT Link
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Gateway: elawyers.paymently.io
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Paymently Settlement Portal
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
                Pre-filled settlement link for Accounticca &amp; E-Lawyers Chambers. All inputs auto-sync with your order and customer profile.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl px-4 py-2.5 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Payable Amount
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                BDT {amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <Link
              to="/checkout"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-colors border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Checkout</span>
            </Link>
          </div>
        </div>

        {/* Feedback alert */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-3 text-xs sm:text-sm font-medium">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Gateway View Mode Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 bg-slate-200/80 rounded-2xl border border-slate-300/80">
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('iframe')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeTab === 'iframe'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Paymently Gateway (Live Iframe)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                Auto-Injected
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('direct_mfs')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeTab === 'direct_mfs'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Manual MFS &amp; TrxID Portal</span>
            </button>
          </div>

          <div className="flex items-center gap-2 px-2">
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <QrCode className="w-3.5 h-3.5 text-white" />
              <span>Mobile QR Code</span>
            </button>
            <button
              type="button"
              onClick={() => setShowParamEditor((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
              <span>{showParamEditor ? 'Hide Parameter Inboxes' : 'Edit Injected Parameters'}</span>
            </button>
            <button
              type="button"
              onClick={updateIframeFromInputs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              title="Refresh Iframe with current parameters"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              <span>Re-Inject</span>
            </button>
          </div>
        </div>

        {/* Embedded Paymently Iframe Section (Active by Default) */}
        {activeTab === 'iframe' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Embedded Iframe Browser Container - 9 cols */}
            <div className="lg:col-span-9 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              {/* Browser Address Bar & Controls */}
              <div className="bg-slate-900 px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mr-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 min-w-0 flex-1 font-mono">
                    <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate select-all">{iframeSrc}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(iframeSrc, 'iframeUrl')}
                      className="text-slate-400 hover:text-white shrink-0 cursor-pointer ml-auto"
                      title="Copy full injected Paymently link"
                    >
                      {copiedNumber === 'iframeUrl' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={updateIframeFromInputs}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Reload Iframe with latest inputs"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <a
                    href={externalPaymentlyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                  >
                    <span>Open in Full Window</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Injected Parameters Summary Bar */}
              <div className="bg-emerald-950/10 border-b border-emerald-900/10 px-4 py-2.5 sm:px-6 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold uppercase tracking-wider text-[10px] text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md">
                    Injected URL Parameters
                  </span>
                  <span className="text-slate-600">
                    <strong>Name:</strong> {clientName || queryName || 'N/A'}
                  </span>
                  <span className="text-slate-300">&bull;</span>
                  <span className="text-slate-600">
                    <strong>Email:</strong> {clientEmail || queryEmail || 'N/A'}
                  </span>
                  <span className="text-slate-300">&bull;</span>
                  <span className="text-slate-600">
                    <strong>Mobile:</strong> {clientPhone || queryPhone || 'N/A'}
                  </span>
                  <span className="text-slate-300">&bull;</span>
                  <span className="text-slate-600">
                    <strong>Amount:</strong> BDT {amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Reference: <code className="font-mono text-slate-700">{referenceId}</code>
                </div>
              </div>

              {/* The Paymently Iframe with Persistent Skeleton & Overlay */}
              <div className="relative w-full h-[680px] sm:h-[760px] bg-slate-50 overflow-hidden">
                {iframeLoading && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center p-4 sm:p-6 bg-slate-50/95 backdrop-blur-xs transition-opacity duration-300">
                    {/* Background Skeleton Geometry simulating Paymently checkout portal */}
                    <div className="absolute inset-0 p-6 sm:p-10 pointer-events-none opacity-40 overflow-hidden select-none">
                      <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
                        {/* Skeleton Top Bar */}
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-slate-200" />
                            <div className="space-y-2">
                              <div className="w-36 h-4 rounded-md bg-slate-300" />
                              <div className="w-24 h-3 rounded-md bg-slate-200" />
                            </div>
                          </div>
                          <div className="w-28 h-8 rounded-xl bg-slate-200" />
                        </div>

                        {/* Skeleton Amount Card */}
                        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                          <div className="w-24 h-3 rounded-md bg-slate-200" />
                          <div className="w-48 h-8 rounded-lg bg-emerald-200/60" />
                          <div className="w-64 h-3 rounded-md bg-slate-200" />
                        </div>

                        {/* Skeleton Input Fields */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="w-20 h-3 rounded-md bg-slate-200" />
                            <div className="w-full h-11 rounded-xl bg-slate-200" />
                          </div>
                          <div className="space-y-2">
                            <div className="w-20 h-3 rounded-md bg-slate-200" />
                            <div className="w-full h-11 rounded-xl bg-slate-200" />
                          </div>
                        </div>

                        {/* Skeleton MFS Channels */}
                        <div className="space-y-2 pt-2">
                          <div className="w-32 h-3 rounded-md bg-slate-200" />
                          <div className="grid grid-cols-4 gap-3">
                            <div className="h-14 rounded-xl bg-pink-100" />
                            <div className="h-14 rounded-xl bg-orange-100" />
                            <div className="h-14 rounded-xl bg-purple-100" />
                            <div className="h-14 rounded-xl bg-blue-100" />
                          </div>
                        </div>

                        {/* Skeleton Button */}
                        <div className="w-full h-14 rounded-2xl bg-emerald-300/50 mt-4" />
                      </div>
                    </div>

                    {/* Centered Floating 'Loading payment portal...' Card */}
                    <div className="relative z-30 max-w-md w-full bg-white/95 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/90 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
                      {/* Animated Glowing Ring Logo */}
                      <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 animate-ping" />
                        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 p-0.5 shadow-lg shadow-emerald-600/30">
                          <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-emerald-400">
                            <Lock className="w-7 h-7" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                            Loading payment portal...
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                          Connecting to Paymently secure BDT settlement engine for Accounticca &amp; E-Lawyers Chambers.
                        </p>
                      </div>

                      {/* Shimmering Progress Bar */}
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative">
                        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 w-1/2 rounded-full animate-[pulse_1.5s_ease-in-out_infinite]" />
                      </div>

                      {/* Injected Context Preview Badges */}
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-left text-xs">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                          <span>Injected Customer Payload</span>
                          <span className="text-emerald-700 font-mono font-bold">BDT {amount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="text-[11px] text-slate-700 space-y-0.5 font-medium">
                          <div className="truncate">
                            <span className="text-slate-400">Name:</span> {clientName || queryName || 'Customer'}
                          </div>
                          <div className="truncate">
                            <span className="text-slate-400">Email:</span> {clientEmail || queryEmail || 'Active Checkout'}
                          </div>
                        </div>
                      </div>

                      {/* Security note or timeout fallback */}
                      {iframeLoadTimeout ? (
                        <div className="pt-1 space-y-2">
                          <p className="text-[11px] text-amber-700 font-medium">
                            Portal loading is taking a moment. You can wait or open directly:
                          </p>
                          <a
                            href={externalPaymentlyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                          >
                            <span>Open Directly on Paymently</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium pt-0.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>256-Bit SSL Encrypted &bull; elawyers.paymently.io</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {iframeSrc ? (
                  <iframe
                    key={iframeKey}
                    src={iframeSrc}
                    title="Paymently BDT Payment Gateway"
                    className="w-full h-full border-0"
                    allow="payment *; clipboard-read; clipboard-write;"
                    onLoad={() => setIframeLoading(false)}
                  />
                ) : (
                  <div className="w-full h-full min-h-[580px] flex flex-col items-center justify-center bg-slate-900 text-slate-400 p-8 space-y-3">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                    <p className="text-sm font-semibold text-slate-300">Initializing Paymently Gateway...</p>
                    <p className="text-xs text-slate-500 font-mono">Securing SSL session for BDT settlement</p>
                  </div>
                )}
              </div>

              {/* Bottom Post-Payment Verification Bar */}
              <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-800">
                <div className="space-y-1">
                  <div className="font-extrabold text-sm text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Completed your Paymently transaction?</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                    Once you submit payment in Paymently, click below to verify order{' '}
                    <strong className="text-emerald-300 font-mono">{referenceId}</strong> and immediately unlock your downloads, licenses, and official invoice voucher.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={handleIframeCompleted}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isSubmitting ? 'Verifying Order...' : 'Verify & Unlock Digital Downloads'}
                    </span>
                  </button>
                  <a
                    href={externalPaymentlyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <span>External Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* 3 Col Sidebar: Quick QR Code & Summary */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-emerald-700" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Mobile Quick QR
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Live
                  </span>
                </div>

                {/* QR Toggle Switcher */}
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-[11px] font-bold text-slate-600">
                  <button
                    type="button"
                    onClick={() => setQrTab('dynamic')}
                    className={`py-1.5 px-2 rounded-lg transition-all ${
                      qrTab === 'dynamic'
                        ? 'bg-white text-emerald-800 shadow-xs font-extrabold'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Dynamic
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrTab('official')}
                    className={`py-1.5 px-2 rounded-lg transition-all ${
                      qrTab === 'official'
                        ? 'bg-white text-emerald-800 shadow-xs font-extrabold'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Official Link
                  </button>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {qrTab === 'dynamic' ? (
                    <>Scan with your MFS app or phone camera to pay <strong>BDT {amount.toLocaleString('en-IN')}</strong>.</>
                  ) : (
                    <>Official Paymently payment link QR code for direct BDT checkout.</>
                  )}
                </p>

                <div className="flex flex-col items-center justify-center bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  {qrTab === 'dynamic' ? (
                    qrCodeDataUrl ? (
                      <button
                        type="button"
                        onClick={() => setShowQrModal(true)}
                        className="cursor-pointer group relative bg-white p-2 rounded-xl shadow-xs border border-slate-200 hover:ring-2 hover:ring-emerald-500 transition-all"
                        title="Click to expand QR Code"
                      >
                        <img src={qrCodeDataUrl} alt="Quick Dynamic QR" className="w-36 h-36 object-contain rounded-lg" />
                        <div className="absolute inset-0 bg-slate-900/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                          Click to Expand
                        </div>
                      </button>
                    ) : (
                      <div className="w-36 h-36 bg-slate-200 animate-pulse rounded-xl flex items-center justify-center text-[11px] text-slate-500">
                        Loading QR...
                      </div>
                    )
                  ) : (
                    (officialQrCodeDataUrl || OFFICIAL_PAYMENTLY_QR_IMAGE) ? (
                      <button
                        type="button"
                        onClick={() => setShowQrModal(true)}
                        className="cursor-pointer group relative bg-white p-2 rounded-xl shadow-xs border border-slate-200 hover:ring-2 hover:ring-emerald-500 transition-all"
                        title="Click to expand Official Paymently QR Code"
                      >
                        <img
                          src={officialQrCodeDataUrl || OFFICIAL_PAYMENTLY_QR_IMAGE}
                          alt="Official Paymently Link QR"
                          className="w-36 h-36 object-contain rounded-lg"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                          Click to Expand
                        </div>
                      </button>
                    ) : (
                      <div className="w-36 h-36 bg-slate-200 animate-pulse rounded-xl flex items-center justify-center text-[11px] text-slate-500">
                        Loading QR...
                      </div>
                    )
                  )}
                  <div className="text-[11px] font-mono font-bold text-slate-700">
                    {qrTab === 'dynamic' ? `Ref: ${referenceId}` : 'elawyers.paymently.io'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl transition-colors text-center inline-flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-200"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Open Full Screen QR</span>
                </button>
              </div>

              {/* Quick Summary Card */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                    Order Reference
                  </span>
                  <span className="text-xs font-mono text-slate-300">{referenceId}</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="text-slate-400">Customer:</div>
                  <div className="font-bold text-white truncate">{clientName || queryName || 'Valued Client'}</div>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="text-slate-400">Total BDT Due:</div>
                  <div className="text-xl font-black text-emerald-400 font-mono">
                    BDT {amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Parameter Inboxes & Manual MFS View (shown if showParamEditor is true OR activeTab is 'direct_mfs') */}
        {(showParamEditor || activeTab === 'direct_mfs') && (
        <form onSubmit={handlePaymentSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Pre-filled Inboxes */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-emerald-700" />
                    <span>Customer &amp; Payment Inboxes (Auto-Filled)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Information automatically loaded from your cart and checkout session. You can edit any field.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                    Auto-Synchronized
                  </span>
                  <button
                    type="button"
                    onClick={handleClearForm}
                    title="Reset all fields to default state"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-full border border-rose-200 shrink-0 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear Form</span>
                  </button>
                  <button
                    type="button"
                    onClick={updateIframeFromInputs}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Update Iframe URL</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Client Name */}
                <div className="sm:col-span-2 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="paymently-client-name" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Client Name *
                    </label>
                    <FieldTooltip content="Full legal name of the individual or authorized company representative procuring this toolkit." />
                  </div>
                  <div className="relative">
                    <UserIcon className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${formErrors.clientName ? 'text-rose-500' : 'text-slate-400'}`} />
                    <input
                      id="paymently-client-name"
                      name="name"
                      autoComplete="name"
                      type="text"
                      inputMode="text"
                      required
                      value={clientName}
                      onChange={(e) => {
                        setClientName(e.target.value);
                        if (formErrors.clientName) {
                          setFormErrors((prev) => {
                            const next = { ...prev };
                            delete next.clientName;
                            return next;
                          });
                        }
                      }}
                      placeholder="e.g. Md. Tanvir Ahmed"
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                        formErrors.clientName
                          ? 'bg-rose-50/50 border-rose-400 text-rose-900 focus:ring-rose-500 focus:bg-white'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white'
                      }`}
                    />
                  </div>
                  {formErrors.clientName && (
                    <p role="alert" className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                      <span>{formErrors.clientName}</span>
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <label htmlFor="paymently-client-email" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Customer Email *
                      </label>
                      <FieldTooltip content="Official email address where statutory templates, download links, and invoices will be delivered." />
                    </div>
                    {isEmailValid && !formErrors.clientEmail ? (
                      <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Valid Email
                      </span>
                    ) : (showEmailError || formErrors.clientEmail) ? (
                      <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Invalid Format
                      </span>
                    ) : null}
                  </div>
                  <div className="relative">
                    <Mail
                      className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                        (showEmailError || formErrors.clientEmail) ? 'text-rose-500' : isEmailValid ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    />
                    <input
                      id="paymently-client-email"
                      name="email"
                      autoComplete="email"
                      type="email"
                      inputMode="email"
                      required
                      value={clientEmail}
                      onBlur={() => setEmailTouched(true)}
                      onChange={(e) => {
                        setClientEmail(e.target.value);
                        if (!emailTouched) setEmailTouched(true);
                        if (errorMessage) setErrorMessage(null);
                        if (formErrors.clientEmail) {
                          setFormErrors((prev) => {
                            const next = { ...prev };
                            delete next.clientEmail;
                            return next;
                          });
                        }
                      }}
                      placeholder="client@example.com"
                      aria-invalid={Boolean(showEmailError || formErrors.clientEmail)}
                      aria-describedby={(showEmailError || formErrors.clientEmail) ? 'email-validation-error' : undefined}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 transition-all ${
                        (showEmailError || formErrors.clientEmail)
                          ? 'bg-rose-50/50 border-rose-400 text-rose-900 focus:ring-rose-500 focus:bg-white placeholder-rose-300'
                          : isEmailValid
                          ? 'bg-emerald-50/20 border-emerald-300 text-slate-900 focus:ring-emerald-500 focus:bg-white'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500 focus:bg-white'
                      }`}
                    />
                  </div>
                  {(showEmailError || formErrors.clientEmail) && (
                    <p
                      id="email-validation-error"
                      role="alert"
                      className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5 mt-1"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                      <span>{formErrors.clientEmail || emailError}</span>
                    </p>
                  )}
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="paymently-client-phone" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Mobile / WhatsApp *
                    </label>
                    <FieldTooltip content="Primary contact phone or WhatsApp number for instant SMS payment confirmation and support." />
                  </div>
                  <div className="relative">
                    <Phone className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${formErrors.clientPhone ? 'text-rose-500' : 'text-slate-400'}`} />
                    <PatternFormat
                      id="paymently-client-phone"
                      name="tel"
                      autoComplete="tel"
                      type="tel"
                      inputMode="tel"
                      required
                      format={clientPhone.trim().startsWith('+') ? '+### ####-######' : '#####-######'}
                      mask="_"
                      value={clientPhone}
                      onValueChange={(values) => {
                        setClientPhone(values.formattedValue);
                        if (formErrors.clientPhone) {
                          setFormErrors((prev) => {
                            const next = { ...prev };
                            delete next.clientPhone;
                            return next;
                          });
                        }
                      }}
                      placeholder="01711-XXXXXX"
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-xs sm:text-sm font-mono font-semibold transition-colors ${
                        formErrors.clientPhone
                          ? 'bg-rose-50/50 border-rose-400 text-rose-900 focus:ring-rose-500 focus:bg-white'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white'
                      }`}
                    />
                  </div>
                  {formErrors.clientPhone && (
                    <p role="alert" className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                      <span>{formErrors.clientPhone}</span>
                    </p>
                  )}
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <label htmlFor="paymently-amount" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Amount (BDT) *
                      </label>
                      <FieldTooltip content="Total payable order amount in Bangladeshi Taka, inclusive of statutory digital licensing." />
                    </div>
                    {isAmountValid && !formErrors.amount ? (
                      <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Positive Value
                      </span>
                    ) : (showAmountError || formErrors.amount) ? (
                      <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Positive Number Required
                      </span>
                    ) : null}
                  </div>
                  <div className="relative">
                    <span
                      className={`font-bold absolute left-3.5 top-1/2 -translate-y-1/2 text-xs transition-colors ${
                        (showAmountError || formErrors.amount) ? 'text-rose-500' : isAmountValid ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      ৳
                    </span>
                    <input
                      id="paymently-amount"
                      name="amount"
                      autoComplete="transaction-amount"
                      type="number"
                      inputMode="decimal"
                      required
                      min="1"
                      step="any"
                      value={amount || ''}
                      onBlur={() => setAmountTouched(true)}
                      onChange={(e) => {
                        const parsed = parseFloat(e.target.value);
                        setAmount(isNaN(parsed) ? 0 : parsed);
                        if (!amountTouched) setAmountTouched(true);
                        if (errorMessage) setErrorMessage(null);
                        if (formErrors.amount) {
                          setFormErrors((prev) => {
                            const next = { ...prev };
                            delete next.amount;
                            return next;
                          });
                        }
                      }}
                      placeholder="0.00"
                      aria-invalid={Boolean(showAmountError || formErrors.amount)}
                      aria-describedby={(showAmountError || formErrors.amount) ? 'amount-validation-error' : undefined}
                      className={`w-full pl-8 pr-4 py-3 border rounded-xl text-xs sm:text-sm font-black font-mono focus:outline-none focus:ring-2 transition-all ${
                        (showAmountError || formErrors.amount)
                          ? 'bg-rose-50/50 border-rose-400 text-rose-900 focus:ring-rose-500 focus:bg-white'
                          : isAmountValid
                          ? 'bg-emerald-50/20 border-emerald-300 text-emerald-800 focus:ring-emerald-500 focus:bg-white'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-emerald-500 focus:bg-white'
                      }`}
                    />
                  </div>
                  {(showAmountError || formErrors.amount) && (
                    <p
                      id="amount-validation-error"
                      role="alert"
                      className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5 mt-1"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                      <span>{formErrors.amount || amountError}</span>
                    </p>
                  )}
                </div>

                {/* Order Reference */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="paymently-reference-id" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Reference / Invoice ID
                    </label>
                    <FieldTooltip content="Unique order tracking token used by Accounticca & E-Lawyers to reconcile your payment." />
                  </div>
                  <div className="relative">
                    <Receipt className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${formErrors.referenceId ? 'text-rose-500' : 'text-slate-400'}`} />
                    <input
                      id="paymently-reference-id"
                      name="reference"
                      autoComplete="off"
                      type="text"
                      inputMode="text"
                      value={referenceId}
                      onChange={(e) => {
                        setReferenceId(e.target.value);
                        if (formErrors.referenceId) {
                          setFormErrors((prev) => {
                            const next = { ...prev };
                            delete next.referenceId;
                            return next;
                          });
                        }
                      }}
                      placeholder="e.g. ACC-2026-00101"
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-xs font-mono font-bold transition-colors ${
                        formErrors.referenceId
                          ? 'bg-rose-50/50 border-rose-400 text-rose-900 focus:ring-rose-500 focus:bg-white'
                          : 'bg-slate-50 border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white'
                      }`}
                    />
                  </div>
                  {formErrors.referenceId && (
                    <p role="alert" className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                      <span>{formErrors.referenceId}</span>
                    </p>
                  )}
                </div>

                {/* Description / Remarks */}
                <div className="sm:col-span-2 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="paymently-remarks" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Purpose / Item Description
                    </label>
                    <FieldTooltip content="Specific description of the purchased digital legal document, tax model, or advisory kit." />
                  </div>
                  <input
                    id="paymently-remarks"
                    name="remarks"
                    autoComplete="off"
                    type="text"
                    inputMode="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Income Tax Calculator 2026-27 License"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Action bar inside Inboxes card */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Reset form inputs back to default values anytime.
                </span>
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50/80 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200/60 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Form</span>
                </button>
              </div>
            </div>

            {/* MFS & Payment Channel Selection */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Select Payment Channel
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official MFS routing through Bangladesh National Payment Switch.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Instant Auto-Verification</span>
                </div>
              </div>

              {/* Channel Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* bKash */}
                <button
                  type="button"
                  onClick={() => setActiveChannel('bkash')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                    activeChannel === 'bkash'
                      ? 'border-[#e2136e] bg-[#e2136e]/5 ring-2 ring-[#e2136e]/30 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-[#e2136e] text-white font-black text-xs flex items-center justify-center">
                    bK
                  </div>
                  <span className="text-xs font-bold text-slate-900">bKash</span>
                  <span className="text-[10px] text-[#e2136e] font-semibold">Send Money</span>
                </button>

                {/* Nagad */}
                <button
                  type="button"
                  onClick={() => setActiveChannel('nagad')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                    activeChannel === 'nagad'
                      ? 'border-[#f7941d] bg-[#f7941d]/5 ring-2 ring-[#f7941d]/30 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-[#f7941d] text-white font-black text-xs flex items-center justify-center">
                    NG
                  </div>
                  <span className="text-xs font-bold text-slate-900">Nagad</span>
                  <span className="text-[10px] text-[#f7941d] font-semibold">Send Money</span>
                </button>

                {/* Rocket */}
                <button
                  type="button"
                  onClick={() => setActiveChannel('rocket')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                    activeChannel === 'rocket'
                      ? 'border-[#8c3494] bg-[#8c3494]/5 ring-2 ring-[#8c3494]/30 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-[#8c3494] text-white font-black text-xs flex items-center justify-center">
                    RK
                  </div>
                  <span className="text-xs font-bold text-slate-900">Rocket</span>
                  <span className="text-[10px] text-[#8c3494] font-semibold">DBBL MFS</span>
                </button>

                {/* Card */}
                <button
                  type="button"
                  onClick={() => setActiveChannel('card')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                    activeChannel === 'card'
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/30 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">Cards</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">Visa / Master</span>
                </button>
              </div>

              {/* Instructions per channel */}
              {activeChannel === 'bkash' && (
                <div className="p-5 rounded-2xl bg-[#e2136e]/5 border border-[#e2136e]/20 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#e2136e] block">
                        Official bKash Personal Number
                      </span>
                      <div className="font-mono text-lg font-black text-slate-900 mt-0.5">
                        01744883636
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('01744883636', 'bkash')}
                      className="px-3 py-1.5 text-xs font-bold text-[#e2136e] bg-white border border-[#e2136e]/30 rounded-xl hover:bg-[#e2136e]/10 transition-colors inline-flex items-center gap-1.5"
                    >
                      {copiedNumber === 'bkash' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedNumber === 'bkash' ? 'Copied' : 'Copy Number'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Open your bKash app &rarr; Select <strong>Send Money</strong> &rarr; Enter number <strong className="font-mono text-slate-900">01744883636</strong> &rarr; Enter amount <strong>৳{amount}</strong> &rarr; Confirm with PIN. Then paste the 10-character TrxID below.
                  </p>
                </div>
              )}

              {activeChannel === 'nagad' && (
                <div className="p-5 rounded-2xl bg-[#f7941d]/5 border border-[#f7941d]/20 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#f7941d] block">
                        Official Nagad Personal Number
                      </span>
                      <div className="font-mono text-lg font-black text-slate-900 mt-0.5">
                        01335230170
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('01335230170', 'nagad')}
                      className="px-3 py-1.5 text-xs font-bold text-[#f7941d] bg-white border border-[#f7941d]/30 rounded-xl hover:bg-[#f7941d]/10 transition-colors inline-flex items-center gap-1.5"
                    >
                      {copiedNumber === 'nagad' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedNumber === 'nagad' ? 'Copied' : 'Copy Number'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Open Nagad app &rarr; Select <strong>Send Money</strong> &rarr; Enter number <strong className="font-mono text-slate-900">01335230170</strong> &rarr; Enter amount <strong>৳{amount}</strong> &rarr; Confirm with PIN. Paste your TrxID below.
                  </p>
                </div>
              )}

              {activeChannel === 'rocket' && (
                <div className="p-5 rounded-2xl bg-[#8c3494]/5 border border-[#8c3494]/20 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#8c3494] block">
                        Official Rocket 12-Digit Number
                      </span>
                      <div className="font-mono text-lg font-black text-slate-900 mt-0.5">
                        01744883636-8
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('017448836368', 'rocket')}
                      className="px-3 py-1.5 text-xs font-bold text-[#8c3494] bg-white border border-[#8c3494]/30 rounded-xl hover:bg-[#8c3494]/10 transition-colors inline-flex items-center gap-1.5"
                    >
                      {copiedNumber === 'rocket' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedNumber === 'rocket' ? 'Copied' : 'Copy Number'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Open Rocket or dial *322# &rarr; Select <strong>Send Money</strong> &rarr; Enter 12-digit number <strong className="font-mono text-slate-900">017448836368</strong> &rarr; Amount <strong>৳{amount}</strong> &rarr; Submit TrxID below.
                  </p>
                </div>
              )}

              {/* TrxID Entry or Card inputs */}
              {activeChannel !== 'card' ? (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <label htmlFor="paymently-trx-id" className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        {activeChannel.toUpperCase()} Transaction ID (TrxID) *
                      </label>
                      <FieldTooltip content="8 to 10-character code sent to you via SMS after completing Send Money on your MFS app." />
                    </div>
                    <button
                      type="button"
                      onClick={handleSimulateTrx}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>Auto-Fill Demo TrxID</span>
                    </button>
                  </div>
                  <input
                    id="paymently-trx-id"
                    name="trxId"
                    autoComplete="off"
                    type="text"
                    inputMode="text"
                    required
                    value={trxId}
                    onChange={(e) => {
                      setTrxId(e.target.value.toUpperCase());
                      if (formErrors.trxId) {
                        setFormErrors((prev) => {
                          const next = { ...prev };
                          delete next.trxId;
                          return next;
                        });
                      }
                    }}
                    placeholder="e.g. 9J4K2L8M7P"
                    className={`w-full px-4 py-3 border rounded-xl text-xs sm:text-sm font-mono font-bold uppercase tracking-wider focus:outline-none focus:ring-2 ${
                      formErrors.trxId
                        ? 'bg-rose-50/50 border-rose-400 text-rose-900 focus:ring-rose-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:ring-emerald-500'
                    }`}
                  />
                  {formErrors.trxId ? (
                    <p role="alert" className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                      <span>{formErrors.trxId}</span>
                    </p>
                  ) : (
                    <div className="text-[11px] text-slate-500">
                      Received via SMS after sending money from your {activeChannel.toUpperCase()} account.
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <label htmlFor="paymently-card-number" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Card Number
                      </label>
                      <FieldTooltip content="16-digit debit or credit card number processed securely through encrypted 256-bit gateway." />
                    </div>
                    <PatternFormat
                      id="paymently-card-number"
                      name="cardnumber"
                      autoComplete="cc-number"
                      type="text"
                      inputMode="numeric"
                      format="#### #### #### ####"
                      mask="_"
                      value={cardNumber}
                      onValueChange={(values) => {
                        setCardNumber(values.formattedValue);
                        if (formErrors.cardNumber) {
                          setFormErrors((prev) => {
                            const next = { ...prev };
                            delete next.cardNumber;
                            return next;
                          });
                        }
                      }}
                      placeholder="4123 4567 8901 2345"
                      className={`w-full px-4 py-3 border rounded-xl text-xs sm:text-sm font-mono focus:ring-2 outline-none ${
                        formErrors.cardNumber
                          ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-rose-500'
                          : 'border-slate-200 text-slate-900 focus:ring-emerald-500'
                      }`}
                    />
                    {formErrors.cardNumber && (
                      <p role="alert" className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5 mt-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                        <span>{formErrors.cardNumber}</span>
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <label htmlFor="paymently-card-expiry" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Expiry (MM/YY)
                        </label>
                        <FieldTooltip content="Two-digit expiration month and two-digit year shown on the front of your payment card." />
                      </div>
                      <PatternFormat
                        id="paymently-card-expiry"
                        name="cc-exp"
                        autoComplete="cc-exp"
                        type="text"
                        inputMode="numeric"
                        format="##/##"
                        mask={['M', 'M', 'Y', 'Y']}
                        value={cardExpiry}
                        onValueChange={(values) => {
                          setCardExpiry(values.formattedValue);
                          if (formErrors.cardExpiry) {
                            setFormErrors((prev) => {
                              const next = { ...prev };
                              delete next.cardExpiry;
                              return next;
                            });
                          }
                        }}
                        placeholder="12/28"
                        className={`w-full px-4 py-3 border rounded-xl text-xs sm:text-sm font-mono focus:ring-2 outline-none ${
                          formErrors.cardExpiry
                            ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-rose-500'
                            : 'border-slate-200 text-slate-900 focus:ring-emerald-500'
                        }`}
                      />
                      {formErrors.cardExpiry && (
                        <p role="alert" className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5 mt-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                          <span>{formErrors.cardExpiry}</span>
                        </p>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <label htmlFor="paymently-card-cvc" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          CVV / CVC
                        </label>
                        <FieldTooltip content="3-digit security verification code printed on the signature strip on the back of your card." />
                      </div>
                      <input
                        id="paymently-card-cvc"
                        name="cvc"
                        autoComplete="cc-csc"
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        value={cardCvc}
                        onChange={(e) => {
                          setCardCvc(e.target.value);
                          if (formErrors.cardCvc) {
                            setFormErrors((prev) => {
                              const next = { ...prev };
                              delete next.cardCvc;
                              return next;
                            });
                          }
                        }}
                        placeholder="•••"
                        className={`w-full px-4 py-3 border rounded-xl text-xs sm:text-sm font-mono focus:ring-2 outline-none ${
                          formErrors.cardCvc
                            ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-rose-500'
                            : 'border-slate-200 text-slate-900 focus:ring-emerald-500'
                        }`}
                      />
                      {formErrors.cardCvc && (
                        <p role="alert" className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5 mt-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                          <span>{formErrors.cardCvc}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary & Confirmation Actions */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-700" />
                  <span>Settlement Summary</span>
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {cartItems.length > 0 ? `${cartItems.length} item(s)` : 'Direct Toolkit'}
                </span>
              </div>

              {/* Product preview */}
              <div className="space-y-3">
                {cartItems.length > 0 ? (
                  cartItems.map((ci) => (
                    <div
                      key={ci.product.id}
                      className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{ci.product.title}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Qty: {ci.quantity} &middot; {ci.product.format}
                        </div>
                      </div>
                      <div className="font-mono font-black text-slate-900 shrink-0">
                        ৳{(ci.product.price * ci.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">
                        {remarks || targetProduct?.title || 'Personal & Corporate Tax Toolkit'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Statutory Compliance License &middot; Finance Act 2026
                      </div>
                    </div>
                    <div className="font-mono font-black text-emerald-800 shrink-0 text-sm">
                      ৳{amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="pt-2 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal Amount:</span>
                  <span className="font-mono font-bold text-slate-900">
                    BDT {amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>MFS Payment Fee:</span>
                  <span className="font-mono font-bold text-emerald-700">0.00 (Waived)</span>
                </div>
                <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-3 border-t border-slate-200">
                  <span>Total Due:</span>
                  <span className="text-xl font-mono text-emerald-700">
                    BDT {amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-5 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 hover:from-emerald-800 hover:to-teal-900 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 text-emerald-200 animate-spin shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                )}
                <span>
                  {isSubmitting
                    ? 'Processing & Verifying Payment...'
                    : `Confirm & Complete Settlement (BDT ${amount.toLocaleString('en-IN')})`}
                </span>
              </button>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="py-3 px-4 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-transparent text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>Clear Form</span>
                </button>
                <a
                  href={externalPaymentlyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 text-center"
                >
                  <span>Official Gateway</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Trust Badges */}
              <div className="pt-2 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Licensed under Bangladesh National Payment Switch regulations.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Digital license keys unlock immediately upon confirmation.</span>
                </div>
              </div>
            </div>

            {/* Helpline Card */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-2 text-xs">
              <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-emerald-700" />
                <span>Need Settlement Assistance?</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                If you face any issues with your MFS payment or TrxID verification, contact our finance desk directly:
              </p>
              <div className="font-mono text-emerald-800 font-bold">
                Hotline / WhatsApp: +88 01335230170 &middot; +88 01744883636
              </div>
            </div>
          </div>
        </form>
        )}
        {/* Dynamic & Official Paymently QR Code Modal */}
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 relative">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight">
                      {qrTab === 'dynamic' ? 'Dynamic Mobile QR Code' : 'Official Paymently Gateway QR'}
                    </h3>
                    <p className="text-xs text-slate-500">Scan with bKash, Nagad, Rocket, or phone camera</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Mode Switcher inside Modal */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setQrTab('dynamic')}
                  className={`py-2 px-3 rounded-lg transition-all ${
                    qrTab === 'dynamic'
                      ? 'bg-white text-emerald-800 shadow-xs font-black'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Dynamic (BDT {amount.toLocaleString('en-IN')})
                </button>
                <button
                  type="button"
                  onClick={() => setQrTab('official')}
                  className={`py-2 px-3 rounded-lg transition-all ${
                    qrTab === 'official'
                      ? 'bg-white text-emerald-800 shadow-xs font-black'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Official Paymently Link
                </button>
              </div>

              {/* QR Code Display */}
              <div className="flex flex-col items-center justify-center space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                {qrTab === 'dynamic' ? (
                  qrCodeDataUrl ? (
                    <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-200">
                      <img src={qrCodeDataUrl} alt="Paymently Dynamic QR Code" className="w-56 h-56 object-contain rounded-lg" />
                    </div>
                  ) : (
                    <div className="w-56 h-56 flex items-center justify-center bg-slate-200 animate-pulse rounded-2xl text-xs text-slate-500 font-medium">
                      Generating QR Code...
                    </div>
                  )
                ) : (
                  (officialQrCodeDataUrl || OFFICIAL_PAYMENTLY_QR_IMAGE) ? (
                    <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-200">
                      <img
                        src={officialQrCodeDataUrl || OFFICIAL_PAYMENTLY_QR_IMAGE}
                        alt="Official Paymently Link QR"
                        className="w-56 h-56 object-contain rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="w-56 h-56 flex items-center justify-center bg-slate-200 animate-pulse rounded-2xl text-xs text-slate-500 font-medium">
                      Loading Official QR...
                    </div>
                  )
                )}
                <div className="text-center space-y-1">
                  <div className="text-xs font-bold text-slate-700">
                    Merchant: <span className="text-slate-900 font-mono">elawyers.paymently.io</span>
                  </div>
                  <div className="text-xs font-extrabold text-emerald-700 font-mono">
                    {qrTab === 'dynamic'
                      ? `Amount: BDT ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                      : 'Pre-set Currency: BDT (Bangladeshi Taka)'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {qrTab === 'dynamic' ? `Ref: ${referenceId}` : 'Paymently BDT Default Link'}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                {qrTab === 'dynamic' && qrCodeDataUrl ? (
                  <a
                    href={qrCodeDataUrl}
                    download={`Paymently-Dynamic-QR-${referenceId}.png`}
                    className="flex-1 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl text-center transition-colors shadow-md inline-flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Download Dynamic QR</span>
                  </a>
                ) : (
                  <a
                    href={OFFICIAL_PAYMENTLY_QR_IMAGE}
                    download="Paymently-Official-BDT-Link-QR.png"
                    className="flex-1 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl text-center transition-colors shadow-md inline-flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Download Official QR</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentlyGatewayPage;
