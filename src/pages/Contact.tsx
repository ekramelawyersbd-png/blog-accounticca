import React, { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  Globe2,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Youtube,
  Facebook,
  Scale,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getAccessToken } from '../services/workspaceAuth';
import { getStoredContactSheetId } from '../services/contactSheetsSync';
import { AppointmentBookingForm } from '../components/AppointmentBookingForm';
import { FloatingLiveChat } from '../components/FloatingLiveChat';
import { OfficeLocationMap } from '../components/OfficeLocationMap';
import { FormSuccessAnimation } from '../components/FormSuccessAnimation';
import { ServiceSEO } from '../components/SEO';
import { dispatchFormSubmissionToast } from '../components/ui/FormSubmissionToast';
import { PatternFormat } from 'react-number-format';
import { useDebounce } from '../hooks/useDebounce';

type ContactTab = 'inquiry' | 'appointment';
type FormField =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'companyName'
  | 'service'
  | 'message';

type InquiryFormData = Record<FormField, string>;
type FieldErrors = Partial<Record<FormField, string>>;
type UrgencyLevel = 'Standard Advisory (24–48h)' | 'Approaching Deadline (< 7 Days)' | 'Urgent Notice / Hearing';

const PRIMARY_PHONE = '+880 1335-230170';
const RAW_PHONE = '+8801335230170';
const ACCOUNTICCA_EMAIL = 'info@accounticca.com';
const ELAWYERS_EMAIL = 'info@elawyersbd.com';
const MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=BTI+Centara+Grand+144+Green+Road+Panthapath+Dhaka+1205';

const INITIAL_FORM: InquiryFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  companyName: '',
  service: 'Corporate Law & RJSC Compliance',
  message: '',
};

const SERVICES = [
  'Corporate Law & RJSC Compliance',
  'Corporate Tax, VAT & Statutory Audit',
  'Fractional CFO & Financial Modeling',
  'BIDA Approvals & Foreign Direct Investment',
  'Commercial Contracts & IP Protection',
  'Business Process Optimization & Automation',
  'Integrated Joint Ecosystem Consultation',
];

const LEGAL_SERVICES = new Set([
  'Corporate Law & RJSC Compliance',
  'BIDA Approvals & Foreign Direct Investment',
  'Commercial Contracts & IP Protection',
]);

const MATTER_TEMPLATES: {
  label: string;
  service: string;
  template: string;
}[] = [
  {
    label: 'RJSC Incorporation & Returns',
    service: 'Corporate Law & RJSC Compliance',
    template:
      'We require assistance with RJSC company formation / annual statutory filing (Schedule X & Form XII) and corporate structuring in Bangladesh. Key details and timeline:',
  },
  {
    label: 'Corporate & Personal Tax',
    service: 'Corporate Tax, VAT & Statutory Audit',
    template:
      'We need advisory support regarding NBR Income Tax return preparation, withholding tax (TDS) compliance, or tax assessment representation for Assessment Year 2026–27:',
  },
  {
    label: 'VAT (Mushak 9.1 & Audit)',
    service: 'Corporate Tax, VAT & Statutory Audit',
    template:
      'We are seeking VAT consultancy regarding BIN registration, monthly Mushak 9.1 return filing, VDS reconciliation, or input-output coefficient (Mushak 4.3) declarations:',
  },
  {
    label: 'BIDA & Foreign Investment',
    service: 'BIDA Approvals & Foreign Direct Investment',
    template:
      'We are an international / joint-venture entity looking for BIDA registration, branch/liaison office setup, work permit processing, or outward remittance compliance:',
  },
  {
    label: 'Contract Drafting & Vetting',
    service: 'Commercial Contracts & IP Protection',
    template:
      'We need legal drafting or vetting for commercial agreements, shareholder agreements, vendor SLAs, or trademark/IP registration in Bangladesh:',
  },
];

const PRACTICE_DESKS = [
  {
    desk: 'Corporate Structuring & Tax Strategy',
    lead: 'Ekramul Islam Khandaker',
    role: 'Founding Member',
    service: 'Integrated Joint Ecosystem Consultation',
    focus: 'Entity formation, strategic tax planning, and multi-regulatory governance',
    imgSrc: 'https://i.ibb.co/tTskLmG0/17-removebg-preview.png',
  },
  {
    desk: 'Commercial Law & Litigation',
    lead: 'Advocate Anamul Haque',
    role: 'Founding Member',
    service: 'Corporate Law & RJSC Compliance',
    focus: 'Contract vetting, RJSC compliance, commercial disputes, and regulatory vetting',
    imgSrc: 'https://i.ibb.co/GQvnZKpX/13.png',
  },
  {
    desk: 'Audit, IFRS & ACCA Advisory',
    lead: 'Muhammad Abdul Kader ACCA',
    role: 'Senior Consultant',
    service: 'Fractional CFO & Financial Modeling',
    focus: 'Financial reporting, statutory audit readiness, and internal control systems',
    imgSrc: 'https://i.ibb.co/2YPhyMYW/19.png',
  },
  {
    desk: 'NBR Income Tax & VAT Compliance',
    lead: 'Zohir Uddin',
    role: 'Partner',
    service: 'Corporate Tax, VAT & Statutory Audit',
    focus: 'Corporate & individual tax returns, Mushak compliance, and tribunal defense',
    imgSrc: 'https://i.ibb.co/FLDh8Wcx/3.png',
  },
];

const CONTACT_FAQS = [
  {
    question: 'How does routing between Accounticca and E-Lawyers work?',
    answer:
      'When you select a service area or submit an inquiry, our intake ledger automatically assigns your brief to E-Lawyers Chambers (for corporate law, RJSC, BIDA, and contracts), Accounticca Advisory (for tax, VAT, audit, and CFO services), or a joint partner desk when your matter spans both legal and financial regulations.',
  },
  {
    question: 'What documents should I prepare before an initial consultation?',
    answer:
      'For tax or VAT matters, having your latest TIN/BIN certificate, prior assessment orders, or Mushak 9.1 summaries is helpful. For corporate or RJSC matters, bring your Memorandum & Articles of Association, trade license, or draft commercial agreement. However, no documents are mandatory for an exploratory call.',
  },
  {
    question: 'Do you offer virtual consultations for overseas or FDI clients?',
    answer:
      'Yes. In addition to in-person meetings at our Panthapath, Dhaka chambers (BTI Centara Grand), we conduct scheduled consultations via Google Meet, Zoom, and WhatsApp for international investors, NRBs, and corporate teams outside Dhaka.',
  },
  {
    question: 'How quickly can the chamber respond to urgent NBR or RJSC notices?',
    answer:
      'For time-sensitive statutory show-cause notices, hearing dates, or withholding tax audits, select "Urgent Notice / Hearing" in Step 1 of the inquiry form or call our direct desk at +880 1335-230170 during chamber hours (Sunday–Thursday).',
  },
];

function getRequestedTab(search: string, hash: string): ContactTab {
  const params = new URLSearchParams(search);
  const requested = params.get('tab');

  if (requested === 'appointment' || requested === 'inquiry') return requested;

  const normalizedHash = hash.toLowerCase();
  if (normalizedHash.includes('appointment') || normalizedHash.includes('book')) {
    return 'appointment';
  }
  if (normalizedHash.includes('inquiry')) return 'inquiry';

  if (params.has('area') || params.has('practice')) return 'appointment';
  return 'inquiry';
}

function validateField(field: FormField, value: string): string | undefined {
  const trimmed = value.trim();

  switch (field) {
    case 'firstName':
    case 'lastName': {
      const label = field === 'firstName' ? 'First name' : 'Last name';
      if (!trimmed) return `${label} is required.`;
      if (trimmed.length < 2) return `${label} must be at least 2 characters.`;
      if (trimmed.length > 80) return `${label} must be 80 characters or fewer.`;
      if (!/\p{L}/u.test(trimmed) || !/^[\p{L}\p{M}\s.'-]+$/u.test(trimmed)) {
        return 'Use letters and common name punctuation only.';
      }
      return undefined;
    }
    case 'email': {
      if (!trimmed) return 'Email address is required.';
      if (trimmed.length > 254 || /\s/.test(trimmed)) return 'Enter a valid email address.';
      const parts = trimmed.split('@');
      if (parts.length !== 2) return 'Enter an email address in the format name@company.com.';
      const [local, domain] = parts;
      if (
        !local ||
        local.length > 64 ||
        local.startsWith('.') ||
        local.endsWith('.') ||
        local.includes('..')
      ) {
        return 'Check the username portion of your email address.';
      }
      const emailPattern =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
      if (!emailPattern.test(trimmed))
        return 'Enter a valid email address, such as name@company.com.';
      const domainLabels = domain.split('.');
      if (domainLabels.some((label) => !label)) return 'Check the domain in your email address.';
      if ((domainLabels.at(-1) ?? '').length < 2)
        return 'Email domain extension must contain at least 2 characters.';
      return undefined;
    }
    case 'phone': {
      const cleaned = trimmed.replace(/_/g, '').trim();
      if (!cleaned) return 'Phone or WhatsApp number is required.';
      const digits = cleaned.replace(/\D/g, '');
      if (digits.length < 8 || digits.length > 15) {
        return 'Enter a phone number containing 8–15 digits.';
      }
      if (!/^\+?[\d\s()._-]+$/.test(trimmed)) {
        return 'Use digits, spaces, parentheses, dots, or hyphens only.';
      }
      return undefined;
    }
    case 'companyName':
      if (trimmed && trimmed.length < 2) return 'Company name must be at least 2 characters.';
      if (trimmed.length > 120) return 'Company name must be 120 characters or fewer.';
      return undefined;
    case 'message':
      if (!trimmed) return 'Please describe your matter.';
      if (trimmed.length < 15)
        return `Please provide at least 15 characters (${trimmed.length}/15).`;
      if (trimmed.length > 3000) return 'Please keep your description under 3,000 characters.';
      return undefined;
    case 'service':
      return SERVICES.includes(value) ? undefined : 'Select a service area.';
    default:
      return undefined;
  }
}

function validateForm(form: InquiryFormData): FieldErrors {
  const fields: FormField[] = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'companyName',
    'service',
    'message',
  ];
  return fields.reduce<FieldErrors>((errors, field) => {
    const error = validateField(field, form[field]);
    if (error) errors[field] = error;
    return errors;
  }, {});
}

type InquiryStep = 1 | 2 | 3;

type StepDefinition = {
  step: InquiryStep;
  key: 'inquiry_details' | 'client_info' | 'final_review';
  title: string;
  subtitle: string;
  fields: FormField[];
  requiredFields: FormField[];
};

const INQUIRY_STEPS: StepDefinition[] = [
  {
    step: 1,
    key: 'inquiry_details',
    title: 'Inquiry Details',
    subtitle: 'Practice area & brief',
    fields: ['service', 'message'],
    requiredFields: ['service', 'message'],
  },
  {
    step: 2,
    key: 'client_info',
    title: 'Client Info',
    subtitle: 'Contact & organization',
    fields: ['firstName', 'lastName', 'email', 'phone', 'companyName'],
    requiredFields: ['firstName', 'lastName', 'email', 'phone'],
  },
  {
    step: 3,
    key: 'final_review',
    title: 'Final Review',
    subtitle: 'Verify & submit',
    fields: ['service', 'message', 'firstName', 'lastName', 'email', 'phone', 'companyName'],
    requiredFields: ['service', 'message', 'firstName', 'lastName', 'email', 'phone'],
  },
];

const STEP_FIELDS: Record<InquiryStep, FormField[]> = {
  1: ['service', 'message'],
  2: ['firstName', 'lastName', 'email', 'phone', 'companyName'],
  3: ['service', 'message', 'firstName', 'lastName', 'email', 'phone', 'companyName'],
};

const FIELD_ELEMENT_IDS: Record<FormField, string> = {
  firstName: 'contact-first-name',
  lastName: 'contact-last-name',
  email: 'contact-email',
  phone: 'contact-phone',
  companyName: 'contact-company-name',
  service: 'contact-service',
  message: 'contact-message',
};

function validateStepFields(step: InquiryStep, form: InquiryFormData): FieldErrors {
  return STEP_FIELDS[step].reduce<FieldErrors>((stepErrors, field) => {
    const error = validateField(field, form[field]);
    if (error) stepErrors[field] = error;
    return stepErrors;
  }, {});
}

function isStepCompleteAndValid(step: InquiryStep, form: InquiryFormData): boolean {
  const stepErrors = validateStepFields(step, form);
  return Object.keys(stepErrors).length === 0;
}

type TextFieldProps = {
  id: string;
  label: string;
  name: string;
  value: string;
  type?: 'text' | 'email' | 'tel';
  inputMode?: 'text' | 'email' | 'tel' | 'numeric' | 'decimal' | 'url' | 'search' | 'none';
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  helper?: string;
  error?: string;
  showError: boolean;
  maxLength?: number;
  onChange: (value: string) => void;
  onBlur: () => void;
};

function TextField({
  id,
  label,
  name,
  value,
  type = 'text',
  inputMode,
  required = true,
  autoComplete,
  placeholder,
  helper,
  error,
  showError,
  maxLength,
  onChange,
  onBlur,
}: TextFieldProps) {
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const hasContent = value.trim().length > 0;
  const isValid = hasContent && !error;
  const resolvedInputMode = inputMode || (type === 'email' ? 'email' : type === 'tel' ? 'tel' : 'text');

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-800">
        {label} {required && <span className="text-emerald-700">*</span>}
      </label>
      <div className="relative">
        {type === 'tel' ? (
          <PatternFormat
            id={id}
            name={name}
            type="tel"
            inputMode={resolvedInputMode}
            autoComplete={autoComplete}
            format={value.trim().startsWith('+') ? '+### ####-######' : '#####-######'}
            mask="_"
            value={value}
            onValueChange={(values) => onChange(values.formattedValue)}
            onBlur={onBlur}
            placeholder={placeholder || '01711-XXXXXX'}
            aria-invalid={showError}
            aria-describedby={showError ? errorId : helper ? helpId : undefined}
            className={`w-full rounded-xl border bg-white px-4 py-3 pr-11 text-sm font-mono text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
              showError
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10'
                : isValid
                ? 'border-emerald-400 focus:border-emerald-600 focus:ring-emerald-600/10'
                : 'border-slate-200 hover:border-slate-300 focus:border-emerald-600 focus:ring-emerald-600/10'
            }`}
          />
        ) : (
          <input
            id={id}
            name={name}
            type={type}
            inputMode={resolvedInputMode}
            autoComplete={autoComplete}
            maxLength={maxLength}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            aria-invalid={showError}
            aria-describedby={showError ? errorId : helper ? helpId : undefined}
            className={`w-full rounded-xl border bg-white px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
              showError
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10'
                : isValid
                ? 'border-emerald-400 focus:border-emerald-600 focus:ring-emerald-600/10'
                : 'border-slate-200 hover:border-slate-300 focus:border-emerald-600 focus:ring-emerald-600/10'
            }`}
          />
        )}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none">
          {isValid ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          ) : showError && error ? (
            <AlertCircle className="h-5 w-5 text-rose-500" aria-hidden="true" />
          ) : null}
        </div>
      </div>
      {showError ? (
        <p
          id={errorId}
          className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-rose-700"
          role="alert"
        >
          <span aria-hidden="true">•</span>
          <span>{error}</span>
        </p>
      ) : helper ? (
        <p id={helpId} className="mt-1.5 text-xs text-slate-500">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

type MessageFieldProps = {
  value: string;
  error?: string;
  showError: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
};

function MessageField({ value, error, showError, onChange, onBlur }: MessageFieldProps) {
  const errorId = 'contact-message-error';
  const helpId = 'contact-message-help';
  const hasValidLength = value.trim().length >= 15;
  const isValid = hasValidLength && !error;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor="contact-message" className="text-sm font-semibold text-slate-800">
          Matter description <span className="text-emerald-700">*</span>
        </label>
        <span
          className={`text-xs font-medium tabular-nums ${
            hasValidLength ? 'text-emerald-800' : 'text-slate-500'
          }`}
        >
          {value.trim().length}/15 minimum characters
        </span>
      </div>
      <div className="relative">
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          maxLength={3000}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder="Tell us briefly about your business, legal, tax, or compliance needs..."
          aria-invalid={showError}
          aria-describedby={showError ? errorId : helpId}
          className={`w-full resize-y rounded-xl border bg-white px-4 py-3 pr-11 leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
            showError
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10'
              : isValid
              ? 'border-emerald-400 focus:border-emerald-600 focus:ring-emerald-600/10'
              : 'border-slate-200 hover:border-slate-300 focus:border-emerald-600 focus:ring-emerald-600/10'
          }`}
        />
        <div className="absolute top-3.5 right-3.5 pointer-events-none">
          {isValid ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          ) : showError && error ? (
            <AlertCircle className="h-5 w-5 text-rose-500" aria-hidden="true" />
          ) : null}
        </div>
      </div>
      {showError ? (
        <p
          id={errorId}
          className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-rose-700"
          role="alert"
        >
          <span aria-hidden="true">•</span>
          <span>{error}</span>
        </p>
      ) : (
        <p id={helpId} className="mt-1.5 text-xs text-slate-500">
          Include relevant assessment years, RJSC entity type, or statutory notice deadlines if applicable.
        </p>
      )}
    </div>
  );
}

type SocialLink = { label: string; href: string; Icon: LucideIcon };

type SocialGroup = {
  brand: string;
  description: string;
  color: 'blue' | 'emerald';
  links: SocialLink[];
};

const SOCIAL_GROUPS: SocialGroup[] = [
  {
    brand: 'ACCOUNTICCA',
    description: 'Tax, finance and business advisory',
    color: 'blue',
    links: [
      { label: 'LinkedIn', href: 'https://linkedin.com/company/accounticca', Icon: Linkedin },
      { label: 'Facebook', href: 'https://facebook.com/accounticca', Icon: Facebook },
      { label: 'YouTube', href: 'https://youtube.com/@accounticca', Icon: Youtube },
    ],
  },
  {
    brand: 'E-LAWYERS',
    description: 'Corporate law and compliance',
    color: 'emerald',
    links: [
      { label: 'LinkedIn', href: 'https://linkedin.com/company/elawyersbd', Icon: Linkedin },
      { label: 'Facebook', href: 'https://facebook.com/elawyersbd', Icon: Facebook },
      { label: 'Instagram', href: 'https://instagram.com/elawyerssbd', Icon: Instagram },
      { label: 'YouTube', href: 'https://youtube.com/@elawyerssbd', Icon: Youtube },
    ],
  },
];

type InquiryFormState = {
  currentStep: InquiryStep;
  data: InquiryFormData;
  touched: Partial<Record<FormField, boolean>>;
  attemptedSteps: Partial<Record<InquiryStep, boolean>>;
  submitAttempted: boolean;
  stepValidationMessage: string | null;
};

const INITIAL_INQUIRY_STATE: InquiryFormState = {
  currentStep: 1,
  data: INITIAL_FORM,
  touched: {},
  attemptedSteps: {},
  submitAttempted: false,
  stepValidationMessage: null,
};

export function Contact() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ContactTab>(() =>
    getRequestedTab(location.search, location.hash),
  );
  const [inquiryState, setInquiryState] = useState<InquiryFormState>(() => {
    try {
      const saved = localStorage.getItem('accounticca_contact_inquiry_draft_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.data) {
          return {
            ...INITIAL_INQUIRY_STATE,
            data: { ...INITIAL_FORM, ...parsed.data },
            currentStep: typeof parsed.currentStep === 'number' ? parsed.currentStep : 1,
          };
        }
      }
    } catch {}
    return INITIAL_INQUIRY_STATE;
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        'accounticca_contact_inquiry_draft_v1',
        JSON.stringify({
          data: inquiryState.data,
          currentStep: inquiryState.currentStep,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch {}
  }, [inquiryState.data, inquiryState.currentStep]);

  const [urgency, setUrgency] = useState<UrgencyLevel>('Standard Advisory (24–48h)');
  const [emailDraftUrl, setEmailDraftUrl] = useState<string | null>(null);
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [submittedInquiryRef, setSubmittedInquiryRef] = useState<string | null>(null);
  const [inquirySheetSynced, setInquirySheetSynced] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const {
    currentStep,
    data: form,
    touched,
    attemptedSteps,
    submitAttempted,
    stepValidationMessage,
  } = inquiryState;

  useEffect(() => {
    setActiveTab(getRequestedTab(location.search, location.hash));
    const params = new URLSearchParams(location.search);
    const paramService = params.get('service');
    const paramLead = params.get('lead');
    if (paramService && SERVICES.includes(paramService)) {
      setInquiryState((prev) => ({
        ...prev,
        currentStep: 1,
        data: {
          ...prev.data,
          service: paramService,
          message:
            paramLead && !prev.data.message.trim()
              ? `Attention: ${paramLead} Desk — We would like to discuss `
              : prev.data.message,
        },
        stepValidationMessage: null,
      }));
    }
    if (location.hash === '#contact-form-section' || paramLead) {
      window.setTimeout(() => {
        document.getElementById('contact-form-section')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
  }, [location.search, location.hash]);

  const debouncedForm = useDebounce(form, 300);
  const errors = useMemo(() => validateForm(debouncedForm), [debouncedForm]);
  const step1Errors = useMemo(() => validateStepFields(1, form), [form]);
  const step2Errors = useMemo(() => validateStepFields(2, form), [form]);

  const isStep1Valid = Object.keys(step1Errors).length === 0;
  const isStep2Valid = Object.keys(step2Errors).length === 0;
  const hasErrors = Object.keys(errors).length > 0;

  const requiredFields: FormField[] = [
    'service',
    'message',
    'firstName',
    'lastName',
    'email',
    'phone',
  ];
  const completedRequiredFields = requiredFields.filter(
    (field) => form[field].trim().length > 0 && !validateField(field, form[field]),
  ).length;
  const completionPercentage = Math.round(
    (completedRequiredFields / requiredFields.length) * 100,
  );

  const currentStepDefinition =
    INQUIRY_STEPS.find((item) => item.step === currentStep) ?? INQUIRY_STEPS[0];
  const currentStepValid =
    currentStep === 1 ? isStep1Valid : currentStep === 2 ? isStep2Valid : !hasErrors;

  const isJointInquiry = form.service === 'Integrated Joint Ecosystem Consultation';
  const assignedDivision = isJointInquiry
    ? 'Accounticca × E-Lawyers'
    : LEGAL_SERVICES.has(form.service)
      ? 'E-Lawyers Chambers'
      : 'Accounticca Advisory';

  const updateField = (field: FormField, value: string) => {
    setInquiryState((prev) => ({
      ...prev,
      data: { ...prev.data, [field]: value },
      stepValidationMessage: null,
    }));
    setEmailDraftUrl(null);
    setSubmittedInquiryRef(null);
  };

  const applyMatterTemplate = (service: string, templateText: string) => {
    setInquiryState((prev) => ({
      ...prev,
      currentStep: 1,
      data: {
        ...prev.data,
        service,
        message: prev.data.message.trim()
          ? prev.data.message
          : `${templateText} `,
      },
      stepValidationMessage: null,
    }));
    window.setTimeout(() => {
      const msgEl = document.getElementById('contact-message') as HTMLTextAreaElement | null;
      msgEl?.focus();
    }, 50);
  };

  const routeToSpecialistDesk = (service: string, leadName: string) => {
    selectTab('inquiry');
    setInquiryState((prev) => ({
      ...prev,
      currentStep: 1,
      data: {
        ...prev.data,
        service,
        message: prev.data.message.trim()
          ? prev.data.message
          : `Attention: ${leadName} Desk — We would like to discuss `,
      },
      stepValidationMessage: null,
    }));
    window.setTimeout(() => {
      document.getElementById('contact-form-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 50);
  };

  const markTouched = (field: FormField) => {
    setInquiryState((prev) => ({
      ...prev,
      touched: { ...prev.touched, [field]: true },
    }));
  };

  const focusField = (field: FormField) => {
    window.setTimeout(() => {
      const element = document.getElementById(FIELD_ELEMENT_IDS[field]);
      element?.focus();
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  };

  const canAccessStep = (targetStep: InquiryStep): boolean => {
    if (targetStep === 1) return true;
    if (targetStep === 2) return isStep1Valid;
    return isStep1Valid && isStep2Valid;
  };

  const goToStep = (targetStep: InquiryStep) => {
    if (targetStep === currentStep) return;

    if (targetStep < currentStep) {
      setInquiryState((prev) => ({
        ...prev,
        currentStep: targetStep,
        stepValidationMessage: null,
      }));
      return;
    }

    if (!isStep1Valid) {
      const firstInvalid = STEP_FIELDS[1].find((f) => step1Errors[f]);
      setInquiryState((prev) => ({
        ...prev,
        currentStep: 1,
        attemptedSteps: { ...prev.attemptedSteps, 1: true },
        touched: { ...prev.touched, service: true, message: true },
        stepValidationMessage:
          'Please complete all required Inquiry Details fields before advancing to the next step.',
      }));
      if (firstInvalid) focusField(firstInvalid);
      return;
    }

    if (targetStep === 3 && !isStep2Valid) {
      const firstInvalid = STEP_FIELDS[2].find((f) => step2Errors[f]);
      setInquiryState((prev) => ({
        ...prev,
        currentStep: 2,
        attemptedSteps: { ...prev.attemptedSteps, 2: true },
        touched: {
          ...prev.touched,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          companyName: true,
        },
        stepValidationMessage:
          'Please complete all required Client Info fields before proceeding to Final Review.',
      }));
      if (firstInvalid) focusField(firstInvalid);
      return;
    }

    setInquiryState((prev) => ({
      ...prev,
      currentStep: targetStep,
      stepValidationMessage: null,
    }));
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      goToStep((currentStep + 1) as InquiryStep);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      goToStep((currentStep - 1) as InquiryStep);
    }
  };

  const selectTab = (tab: ContactTab) => {
    const params = new URLSearchParams(location.search);
    params.set('tab', tab);
    navigate(
      {
        pathname: location.pathname,
        search: params.toString() ? `?${params.toString()}` : '',
        hash: `#${tab}`,
      },
      { replace: true },
    );
    setActiveTab(tab);
  };

  const scrollToForm = (tab: ContactTab) => {
    selectTab(tab);
    window.setTimeout(() => {
      document.getElementById('contact-form-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  };

  const handleCopy = async (value: string, label: string) => {
    setCopyError(null);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(value);
      setCopyStatus(label);
      window.setTimeout(() => setCopyStatus(null), 2200);
    } catch {
      setCopyError(
        'Copy is unavailable in this browser. Please select the contact detail and copy it manually.',
      );
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (currentStep < 3) {
      handleNextStep();
      return;
    }

    setInquiryState((prev) => ({
      ...prev,
      submitAttempted: true,
      attemptedSteps: { 1: true, 2: true, 3: true },
      touched: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        companyName: true,
        service: true,
        message: true,
      },
      stepValidationMessage: null,
    }));
    setEmailDraftUrl(null);
    setSubmittedInquiryRef(null);

    if (hasErrors) {
      const firstInvalidStep1 = STEP_FIELDS[1].find((field) => errors[field]);
      if (firstInvalidStep1) {
        goToStep(1);
        return;
      }
      const firstInvalidStep2 = STEP_FIELDS[2].find((field) => errors[field]);
      if (firstInvalidStep2) {
        goToStep(2);
        return;
      }
      return;
    }

    setIsSubmittingInquiry(true);
    const refNumber = Math.floor(10000 + Math.random() * 90000);
    const referenceId = `INQ-2026-${refNumber}`;

    const recipient = isJointInquiry
      ? ACCOUNTICCA_EMAIL
      : LEGAL_SERVICES.has(form.service)
        ? ELAWYERS_EMAIL
        : ACCOUNTICCA_EMAIL;
    const division = assignedDivision;

    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    const enrichedMessage = `[Urgency: ${urgency}]\n${form.message.trim()}`;

    // 1. Best-effort Firestore save
    try {
      await addDoc(collection(db, 'contact_messages'), {
        referenceId,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        fullName,
        email: form.email.trim(),
        phone: form.phone.trim(),
        companyName: form.companyName.trim() || 'Direct Client / Individual',
        service: form.service,
        urgency,
        division,
        message: enrichedMessage,
        status: 'new',
        createdAt: serverTimestamp(),
      });
    } catch (fsErr) {
      console.warn('Firestore inquiry backup notice:', fsErr);
    }

    // 2. Save to Backend Ledger & Real-Time Workspace Google Sheet Sync
    let synced = false;
    try {
      const workspaceAccessToken = getAccessToken();
      const spreadsheetId = getStoredContactSheetId();
      const res = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceId,
          requestType: 'Service Inquiry',
          division,
          clientName: fullName,
          email: form.email.trim(),
          phone: form.phone.trim(),
          companyName: form.companyName.trim() || 'Direct Client / Individual',
          serviceArea: form.service,
          expertiseTopic: `General Service Inquiry (${urgency})`,
          consultationMode: 'N/A (Written Inquiry)',
          preferredDate: 'Immediate / Written',
          preferredTimeSlot: 'N/A',
          assignedPartner: `${division} (${recipient})`,
          messageOrNotes: enrichedMessage,
          status: 'New Inquiry',
          workspaceAccessToken: workspaceAccessToken || undefined,
          spreadsheetId: spreadsheetId || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        synced = Boolean(data.sheetSynced);
      }
    } catch (apiErr) {
      console.warn('Backend contact ledger notice:', apiErr);
    }

    const cc = isJointInquiry ? `&cc=${encodeURIComponent(ELAWYERS_EMAIL)}` : '';
    const subject = `[${referenceId}] Consultation Inquiry — ${form.service}`;
    const body = [
      `Reference ID: ${referenceId}`,
      `Priority / Urgency: ${urgency}`,
      'New consultation inquiry',
      '',
      `Name: ${fullName}`,
      `Email: ${form.email.trim()}`,
      `Phone / WhatsApp: ${form.phone.trim()}`,
      `Company: ${form.companyName.trim() || 'Not provided'}`,
      `Service area: ${form.service}`,
      '',
      'Matter description:',
      form.message.trim(),
    ].join('\n');

    setSubmittedInquiryRef(referenceId);
    setInquirySheetSynced(synced);
    setEmailDraftUrl(
      `mailto:${recipient}?subject=${encodeURIComponent(subject)}${cc}&body=${encodeURIComponent(body)}`,
    );
    setIsSubmittingInquiry(false);

    dispatchFormSubmissionToast({
      title: 'Consultation Inquiry Submitted!',
      position: `${form.service} · ${division}`,
      message: `Thank you, ${fullName}. Your inquiry has been routed to our specialist desk for review.`,
      referenceId,
      recipientEmail: form.email.trim(),
      type: 'success',
    });
  };

  const resetForm = () => {
    setInquiryState(INITIAL_INQUIRY_STATE);
    setUrgency('Standard Advisory (24–48h)');
    setEmailDraftUrl(null);
    setSubmittedInquiryRef(null);
    setInquirySheetSynced(false);
  };

  const inputError = (field: FormField, step: InquiryStep) =>
    Boolean((touched[field] || attemptedSteps[step] || submitAttempted) && errors[field]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5" data-step="inquiry-details">
            {/* Quick Matter Templates */}
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-600">
                Quick-fill matter template (optional):
              </p>
              <div className="flex flex-wrap gap-2">
                {MATTER_TEMPLATES.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => applyMatterTemplate(item.service, item.template)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                      form.service === item.service && form.message.includes(item.template.slice(0, 25))
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-white'
                    }`}
                  >
                    + {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="contact-service"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Service area <span className="text-emerald-700">*</span>
              </label>
              <select
                id="contact-service"
                name="service"
                value={form.service}
                onChange={(event) => updateField('service', event.target.value)}
                onBlur={() => markTouched('service')}
                aria-invalid={inputError('service', 1)}
                aria-describedby={
                  inputError('service', 1) ? 'contact-service-error' : 'contact-service-routing'
                }
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-4 ${
                  inputError('service', 1)
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10'
                    : 'border-slate-200 hover:border-slate-300 focus:border-emerald-600 focus:ring-emerald-600/10'
                }`}
              >
                {SERVICES.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
              {inputError('service', 1) ? (
                <p
                  id="contact-service-error"
                  role="alert"
                  className="mt-1.5 text-xs font-medium text-rose-700"
                >
                  {errors.service}
                </p>
              ) : (
                <p id="contact-service-routing" className="mt-1.5 text-xs text-slate-500">
                  Routed to <span className="font-semibold text-slate-700">{assignedDivision}</span>
                </p>
              )}
            </div>

            {/* Urgency / Timeline Selector */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Timeline &amp; statutory urgency
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(
                  [
                    'Standard Advisory (24–48h)',
                    'Approaching Deadline (< 7 Days)',
                    'Urgent Notice / Hearing',
                  ] as UrgencyLevel[]
                ).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setUrgency(level)}
                    className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold text-left transition cursor-pointer ${
                      urgency === level
                        ? 'border-emerald-700 bg-emerald-50/70 text-emerald-950 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <MessageField
              value={form.message}
              error={errors.message}
              showError={inputError('message', 1)}
              onChange={(value) => updateField('message', value)}
              onBlur={() => markTouched('message')}
            />

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                {isStep1Valid
                  ? 'Step 1 validated — ready to enter your contact details.'
                  : 'Complete your service area and brief (min. 15 characters) to continue.'}
              </p>
              <button
                type="button"
                onClick={handleNextStep}
                aria-disabled={!isStep1Valid}
                className={`group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-emerald-600/20 cursor-pointer ${
                  isStep1Valid
                    ? 'bg-[#0b5e48] text-white shadow-sm hover:bg-[#084b3a]'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300/80'
                }`}
              >
                Continue to Client Info
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5" data-step="client-info">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="contact-first-name"
                label="First name"
                name="firstName"
                value={form.firstName}
                autoComplete="given-name"
                placeholder="Your first name"
                maxLength={80}
                error={errors.firstName}
                showError={inputError('firstName', 2)}
                onChange={(value) => updateField('firstName', value)}
                onBlur={() => markTouched('firstName')}
              />
              <TextField
                id="contact-last-name"
                label="Last name"
                name="lastName"
                value={form.lastName}
                autoComplete="family-name"
                placeholder="Your last name"
                maxLength={80}
                error={errors.lastName}
                showError={inputError('lastName', 2)}
                onChange={(value) => updateField('lastName', value)}
                onBlur={() => markTouched('lastName')}
              />
              <TextField
                id="contact-email"
                label="Work or personal email"
                name="email"
                type="email"
                value={form.email}
                autoComplete="email"
                placeholder="you@company.com"
                maxLength={254}
                error={errors.email}
                showError={inputError('email', 2)}
                onChange={(value) => updateField('email', value)}
                onBlur={() => markTouched('email')}
              />
              <TextField
                id="contact-phone"
                label="Phone or WhatsApp"
                name="phone"
                type="tel"
                value={form.phone}
                autoComplete="tel"
                placeholder="+880 1XXX-XXXXXX"
                maxLength={24}
                error={errors.phone}
                showError={inputError('phone', 2)}
                onChange={(value) => updateField('phone', value)}
                onBlur={() => markTouched('phone')}
              />
              <div className="sm:col-span-2">
                <TextField
                  id="contact-company-name"
                  label="Company or organization name (optional)"
                  name="companyName"
                  required={false}
                  value={form.companyName}
                  autoComplete="organization"
                  placeholder="Company, startup, or organization name"
                  maxLength={120}
                  helper="Leave blank if you are contacting us as an individual taxpayer or private client."
                  error={errors.companyName}
                  showError={inputError('companyName', 2)}
                  onChange={(value) => updateField('companyName', value)}
                  onBlur={() => markTouched('companyName')}
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handlePreviousStep}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                Back to Inquiry Details
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                aria-disabled={!isStep2Valid}
                className={`group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-emerald-600/20 cursor-pointer ${
                  isStep2Valid
                    ? 'bg-[#0b5e48] text-white shadow-sm hover:bg-[#084b3a]'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300/80'
                }`}
              >
                Continue to Final Review
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        );

      case 3:
        if (submittedInquiryRef) {
          return (
            <div data-step="success-animation">
              <FormSuccessAnimation
                referenceId={submittedInquiryRef}
                clientName={`${form.firstName.trim()} ${form.lastName.trim()}`.trim()}
                email={form.email.trim()}
                phone={form.phone.trim()}
                service={form.service}
                division={assignedDivision}
                message={form.message.trim()}
                inquirySheetSynced={inquirySheetSynced}
                emailDraftUrl={emailDraftUrl}
                onReset={resetForm}
              />
            </div>
          );
        }

        return (
          <div className="space-y-5" data-step="final-review">
            <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-slate-50/60">
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-emerald-800">01. Inquiry Details</p>
                    <h4 className="mt-0.5 text-sm font-semibold text-slate-900">{form.service}</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="text-xs font-semibold text-emerald-800 underline underline-offset-4 hover:text-emerald-950 cursor-pointer"
                  >
                    Edit details
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Assigned division: {assignedDivision} · Priority: {urgency}
                </p>
                <div className="mt-3 rounded-xl border border-slate-200/80 bg-white p-3.5 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
                  {form.message.trim()}
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-emerald-800">02. Client Info</p>
                    <h4 className="mt-0.5 text-sm font-semibold text-slate-900">
                      {form.firstName.trim()} {form.lastName.trim()}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="text-xs font-semibold text-emerald-800 underline underline-offset-4 hover:text-emerald-950 cursor-pointer"
                  >
                    Edit client info
                  </button>
                </div>
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-slate-500">Email address</dt>
                    <dd className="mt-0.5 break-all font-medium text-slate-900">
                      {form.email.trim()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Phone / WhatsApp</dt>
                    <dd className="mt-0.5 font-medium tabular-nums text-slate-900">
                      {form.phone.trim()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Organization</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">
                      {form.companyName.trim() || 'Direct Client / Individual'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {submitAttempted && hasErrors && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
              >
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Please review the highlighted fields before submitting your inquiry.</span>
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handlePreviousStep}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                Back to Client Info
              </button>
              <button
                type="submit"
                disabled={isSubmittingInquiry}
                className="group inline-flex min-h-12 flex-1 items-center justify-center gap-2.5 rounded-xl bg-[#0b5e48] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-900/10 transition hover:bg-[#084b3a] hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-emerald-600/20 disabled:opacity-60 cursor-pointer"
              >
                {isSubmittingInquiry
                  ? 'Booking consultation...'
                  : 'Book Now'}
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </button>
            </div>
            <p className="text-center text-xs leading-5 text-slate-500">
              Submitting saves your inquiry directly to our Workspace Contact Ledger &amp; Google Sheet and prepares an optional direct email draft.
            </p>
          </div>
        );
    }
  };

  return (
    <main className="min-h-screen border-white bg-[#f5f7f4] pb-16 text-slate-900">
      <ServiceSEO
        title={
          activeTab === 'appointment'
            ? 'Book a Legal, Tax or RJSC Consultation | E-Lawyers & Accounticca Chambers'
            : 'Contact Chambers – Legal, Tax, VAT & Corporate Advisory | Accounticca & E-Lawyers'
        }
        description="Schedule a 1-on-1 legal, income tax, VAT, or RJSC company compliance consultation at E-Lawyers & Accounticca Chambers in Panthapath, Dhaka."
        serviceType="Legal, Tax & Corporate Compliance Advisory"
        canonicalUrl="/contact"
      />
      {/* 1. Hero Section */}
      <section className="px-4 pb-10 pt-5 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/50 to-teal-50/30 text-slate-900 shadow-lg shadow-emerald-950/5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(16,185,129,0.10),transparent_42%),radial-gradient(ellipse_at_0%_100%,rgba(20,184,166,0.08),transparent_38%)]" />

          <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
            <nav
              aria-label="Breadcrumb"
              className="mb-8 flex items-center gap-2 text-sm text-slate-600"
            >
              <Link to="/" className="transition hover:text-emerald-800">
                Home
              </Link>
              <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <span className="font-semibold text-slate-900">Contact &amp; Chambers</span>
            </nav>

            <div className="grid gap-10 lg:grid-cols-[1.28fr_0.72fr] lg:items-end">
              <div>
                <p className="mb-3 text-xs sm:text-sm font-semibold text-emerald-800">
                  Accounticca × E-Lawyers · Joint Advisory Chambers · Dhaka, Bangladesh
                </p>
                <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">
                  One point of contact.
                  <span className="mt-1 block text-emerald-700">Complete legal &amp; tax support.</span>
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  Corporate law, RJSC compliance, NBR income tax, VAT, statutory audit, and BIDA foreign investment advisory—connected through one coordinated chamber.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-500">
                  <span className="font-semibold text-slate-800">Sunday–Thursday (10:00 AM – 7:00 PM)</span>
                  <span aria-hidden="true">·</span>
                  <span>In-Chamber &amp; Virtual Consultations</span>
                  <span aria-hidden="true">·</span>
                  <span>Panthapath, Dhaka</span>
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => scrollToForm('appointment')}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-600/20 cursor-pointer"
                  >
                    <CalendarDays className="h-4 w-4" aria-hidden="true" /> Book a consultation
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToForm('inquiry')}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-xs transition hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-950 focus:outline-none focus:ring-4 focus:ring-emerald-600/15 cursor-pointer"
                  >
                    <MessageCircle className="h-4 w-4 text-emerald-700" aria-hidden="true" /> Send a written brief
                  </button>
                  <Link
                    to="/team"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white/80 hover:text-emerald-800"
                  >
                    <Users className="h-4 w-4 text-emerald-700" aria-hidden="true" /> View 21 Advisors
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-sm sm:p-6">
                <p className="text-xs font-semibold text-emerald-800">Direct Chamber Hotline</p>
                <a
                  href={`tel:${RAW_PHONE}`}
                  className="mt-2.5 flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-950 transition hover:text-emerald-700 sm:text-3xl tabular-nums"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Phone className="h-5 w-5" aria-hidden="true" />
                  </span>
                  {PRIMARY_PHONE}
                </a>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Immediate routing for corporate retainers, tax assessments, and RJSC filings.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={`https://wa.me/8801335230170`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>WhatsApp Desk</span>
                    <ExternalLink className="h-3 w-3 opacity-75" />
                  </a>
                  <button
                    type="button"
                    onClick={() => void handleCopy(RAW_PHONE, 'hero-phone')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    {copyStatus === 'hero-phone' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-700" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                    )}
                    <span>{copyStatus === 'hero-phone' ? 'Copied' : 'Copy Number'}</span>
                  </button>
                </div>
                <div className="mt-5 border-t border-slate-200 pt-4">
                  <p className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                    <span>
                      Suite G-5, BTI Centara Grand, 144–144/1 Green Road, Panthapath, Dhaka–1205
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-3 border-t border-emerald-200/70 pt-6 sm:grid-cols-3">
              <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-800">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </span>
                Strict attorney-client &amp; financial confidentiality
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-800">
                  <Scale className="h-4 w-4" aria-hidden="true" />
                </span>
                Integrated High Court Advocates &amp; ACCA Advisors
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-800">
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                </span>
                Direct docket reference &amp; partner assignment
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Direct Contact Channels */}
      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-6 max-w-2xl">
          <p className="text-xs font-semibold text-emerald-800">Direct Contact Channels</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Reach the right desk directly
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-600">
            Connect with our Dhaka chambers by phone, WhatsApp, or practice-specific email desks.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition duration-200 hover:border-emerald-300 hover:shadow-md">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-4 text-xs font-semibold text-emerald-800">01. Principal Chambers</p>
            <h3 className="mt-1 text-lg font-bold text-slate-950">ACCOUNTICCA × E-LAWYERS</h3>
            <address className="mt-2.5 not-italic text-sm leading-6 text-slate-600">
              Suite G-5, BTI Centara Grand
              <br />
              144–144/1 Green Road, Panthapath
              <br />
              Dhaka–1205, Bangladesh
            </address>
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950"
            >
              Open in Google Maps <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </article>

          <article className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition duration-200 hover:border-emerald-300 hover:shadow-md">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              <Phone className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-4 text-xs font-semibold text-emerald-800">02. Telephone &amp; WhatsApp</p>
            <h3 className="mt-1 text-lg font-bold text-slate-950">Direct Advisory Line</h3>
            <a
              href={`tel:${RAW_PHONE}`}
              className="mt-2.5 block text-xl font-bold tracking-tight text-slate-900 hover:text-emerald-800 tabular-nums"
            >
              {PRIMARY_PHONE}
            </a>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleCopy(RAW_PHONE, 'phone')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 cursor-pointer"
                aria-label="Copy phone number"
              >
                {copyStatus === 'phone' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-700" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copyStatus === 'phone' ? 'Copied' : 'Copy number'}
              </button>
              <a
                href="https://wa.me/8801335230170"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp Chat
              </a>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Available Sunday to Thursday for corporate consultations and urgent statutory filings.
            </p>
          </article>

          <article className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition duration-200 hover:border-emerald-300 hover:shadow-md">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              <Mail className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-4 text-xs font-semibold text-emerald-800">03. Practice Email Desks</p>
            <h3 className="mt-1 text-lg font-bold text-slate-950">Official Dispatch Desks</h3>
            <div className="mt-3.5 space-y-3.5">
              <div>
                <p className="text-xs font-medium text-slate-500">Finance, tax, VAT and audit</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <a
                    href={`mailto:${ACCOUNTICCA_EMAIL}`}
                    className="break-all text-sm font-semibold text-emerald-800 hover:underline"
                  >
                    {ACCOUNTICCA_EMAIL}
                  </a>
                  <button
                    type="button"
                    onClick={() => void handleCopy(ACCOUNTICCA_EMAIL, ACCOUNTICCA_EMAIL)}
                    aria-label="Copy Accounticca email"
                    className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-800 cursor-pointer"
                  >
                    {copyStatus === ACCOUNTICCA_EMAIL ? (
                      <Check className="h-4 w-4 text-emerald-700" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500">Corporate law and compliance</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <a
                    href={`mailto:${ELAWYERS_EMAIL}`}
                    className="break-all text-sm font-semibold text-teal-800 hover:underline"
                  >
                    {ELAWYERS_EMAIL}
                  </a>
                  <button
                    type="button"
                    onClick={() => void handleCopy(ELAWYERS_EMAIL, ELAWYERS_EMAIL)}
                    aria-label="Copy E-Lawyers email"
                    className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-teal-50 hover:text-teal-800 cursor-pointer"
                  >
                    {copyStatus === ELAWYERS_EMAIL ? (
                      <Check className="h-4 w-4 text-teal-700" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
        {copyError && (
          <p
            role="status"
            className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            {copyError}
          </p>
        )}
      </section>

      {/* 3. Specialist Practice Desks Routing Strip */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold text-emerald-800">Practice Leadership Routing</p>
              <h2 className="mt-1 text-xl sm:text-2xl font-bold text-slate-950">
                Route your inquiry directly to a specialist partner desk
              </h2>
            </div>
            <Link
              to="/team"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950"
            >
              <span>Meet all 21 team members</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRACTICE_DESKS.map((item) => (
              <article
                key={item.lead}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 hover:bg-white hover:border-emerald-300 hover:shadow-xs transition"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={item.imgSrc}
                      alt={item.lead}
                      loading="lazy"
                      className="h-12 w-12 rounded-full object-cover object-top border border-slate-200 bg-white shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{item.lead}</h3>
                      <p className="text-xs font-medium text-emerald-700">{item.role}</p>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 mb-1">{item.desk}</p>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">{item.focus}</p>
                </div>

                <button
                  type="button"
                  onClick={() => routeToSpecialistDesk(item.service, item.lead)}
                  className="w-full py-2 px-3 rounded-xl bg-white hover:bg-emerald-700 text-emerald-800 hover:text-white border border-slate-200 hover:border-emerald-700 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Route Brief to Desk</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Inquiry Wizard & Appointment Booking Section */}
      <section
        id="contact-form-section"
        className="mx-auto max-w-7xl scroll-mt-6 px-4 py-10 sm:px-6 lg:px-8"
      >
        <div className="space-y-8">
          <div className="app-form-60 w-full lg:w-[60vw] mx-auto">
            <div className="text-center max-w-3xl mx-auto">
              <p className="text-xs font-semibold text-emerald-800">Consultation &amp; Intake Desk</p>
              <h2 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl">
                Tell us what you’re working on.
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Submit a structured written brief or schedule a consultation slot. Every submission receives an official docket reference and is routed to the appropriate practice lead.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Coordinated legal &amp; tax review
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Your selected service routes your brief to E-Lawyers Chambers, Accounticca Advisory, or both.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                  <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Quick-fill statutory templates
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Use the one-click templates in Step 1 to structure RJSC, NBR tax, VAT, or BIDA inquiries effortlessly.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                  <Clock3 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Priority statutory response
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Flag approaching deadlines or hearing dates so our partners can prioritize your file.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="app-form-60 w-full lg:w-[60vw] mx-auto overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
            <div className="border-b border-slate-100 p-3 sm:p-4">
              <div
                className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5"
                role="tablist"
                aria-label="Contact options"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'inquiry'}
                  onClick={() => selectTab('inquiry')}
                  className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-emerald-600/10 cursor-pointer ${
                    activeTab === 'inquiry'
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  <FileText className="h-4 w-4" aria-hidden="true" /> Send an inquiry
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'appointment'}
                  onClick={() => selectTab('appointment')}
                  className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-emerald-600/10 cursor-pointer ${
                    activeTab === 'appointment'
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  <CalendarDays className="h-4 w-4" aria-hidden="true" /> Book appointment
                </button>
              </div>
            </div>

            {activeTab === 'appointment' ? (
              <div className="p-5 sm:p-8" role="tabpanel">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-slate-950">Book a consultation</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Choose your preferred advisor, consultation mode, and time slot below.
                  </p>
                </div>
                <AppointmentBookingForm />
              </div>
            ) : (
              <div className="p-5 sm:p-8" role="tabpanel">
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-950">
                      {submittedInquiryRef ? 'Inquiry Registered' : 'Send your matter brief'}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {submittedInquiryRef
                        ? `Official Docket Reference: ${submittedInquiryRef}`
                        : `Step ${currentStep} of 3: ${currentStepDefinition.title} — ${currentStepDefinition.subtitle}`}
                    </p>
                  </div>
                  <span className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-emerald-900">
                    <ShieldCheck className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                    <span>
                      {submittedInquiryRef
                        ? '100% Complete · Dispatched'
                        : currentStepValid
                          ? 'Current step ready'
                          : 'Validation required'}
                    </span>
                  </span>
                </div>

                {/* Stepper & Progress Container */}
                <div className="mb-6 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-slate-700">
                      {submittedInquiryRef
                        ? 'All Steps Complete'
                        : `Step ${currentStep} of 3 · ${currentStepDefinition.title}`}
                    </span>
                    <span className="font-bold tabular-nums text-slate-800">
                      {submittedInquiryRef
                        ? 'Inquiry Confirmed · 100%'
                        : `${completedRequiredFields} of ${requiredFields.length} required fields valid · ${completionPercentage}%`}
                    </span>
                  </div>
                  <div
                    className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-200"
                    role="progressbar"
                    aria-label="Required fields completed"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={submittedInquiryRef ? 100 : completionPercentage}
                  >
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                      style={{ width: `${submittedInquiryRef ? 100 : completionPercentage}%` }}
                    />
                  </div>

                  <ol
                    className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
                    aria-label="Inquiry form steps"
                  >
                    {INQUIRY_STEPS.map(({ step, title, subtitle }) => {
                      const isActive = !submittedInquiryRef && currentStep === step;
                      const stepValid = isStepCompleteAndValid(step, form);
                      const isCompleted =
                        Boolean(submittedInquiryRef) ||
                        (step === 1 && stepValid && currentStep > 1) ||
                        (step === 2 && stepValid && currentStep > 2);
                      const unlocked = !submittedInquiryRef && canAccessStep(step);

                      return (
                        <li key={step}>
                          <button
                            type="button"
                            onClick={() => {
                              if (submittedInquiryRef) {
                                resetForm();
                                goToStep(step);
                              } else {
                                goToStep(step);
                              }
                            }}
                            aria-current={isActive ? 'step' : undefined}
                            aria-disabled={!unlocked && step > currentStep && !submittedInquiryRef}
                            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition focus:outline-none focus:ring-4 focus:ring-emerald-600/15 cursor-pointer ${
                              isActive
                                ? 'border-emerald-700 bg-white text-slate-950 shadow-xs'
                                : isCompleted
                                  ? 'border-emerald-200 bg-white text-slate-900 hover:border-emerald-400'
                                  : unlocked
                                    ? 'border-slate-200 bg-white/70 text-slate-700 hover:border-slate-300 hover:bg-white'
                                    : 'border-slate-200/70 bg-slate-100/70 text-slate-400'
                            }`}
                          >
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums transition ${
                                isActive
                                  ? 'bg-emerald-700 text-white'
                                  : isCompleted
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-200/80 text-slate-700'
                              }`}
                            >
                              {isCompleted ? (
                                <Check className="h-4 w-4" aria-hidden="true" />
                              ) : (
                                `0${step}`
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold text-slate-900">{title}</p>
                              <p className="truncate text-[11px] text-slate-500">{subtitle}</p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </div>

                {stepValidationMessage && (
                  <div
                    role="alert"
                    className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                  >
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{stepValidationMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  {renderStepContent()}
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. Pre-Consultation FAQ Section */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-9 shadow-xs">
          <div className="max-w-2xl mb-6">
            <p className="text-xs font-semibold text-emerald-800">Client Intake Guidance</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Frequently asked questions before booking
            </h2>
          </div>

          <div className="divide-y divide-slate-200 border-t border-slate-200">
            {CONTACT_FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={faq.question} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 text-left py-1 text-sm sm:text-base font-semibold text-slate-900 hover:text-emerald-800 transition cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-emerald-700' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-600 pr-8">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Portals */}
      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-9">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-800">Our Advisory Ecosystem</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Explore our specialist portals
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              Find the right specialist practice for your corporate law, taxation, and compliance needs.
            </p>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            <a
              href="https://accounticca.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-5 transition hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700 text-lg font-bold text-white">
                  A
                </span>
                <div>
                  <h3 className="font-semibold text-slate-950">ACCOUNTICCA</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Accounting, tax, VAT, audit and finance
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700">
                    accounticca.com <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </div>
              </div>
              <ArrowUpRight
                className="h-5 w-5 shrink-0 text-blue-700 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </a>
            <a
              href="https://elawyersbd.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-lg font-bold text-white">
                  E
                </span>
                <div>
                  <h3 className="font-semibold text-slate-950">E-LAWYERS</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Corporate law, litigation and compliance
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                    elawyersbd.com <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </div>
              </div>
              <ArrowUpRight
                className="h-5 w-5 shrink-0 text-emerald-700 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </a>
            <a
              href="https://blog.accounticca.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Accounticca Advisory Blog</h3>
                <p className="mt-1 text-xs text-slate-500">Guides, updates and business insights</p>
              </div>
              <ExternalLink className="ml-auto h-4 w-4 text-slate-400" aria-hidden="true" />
            </a>
            <a
              href="https://elawyersbd.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-emerald-200 hover:bg-emerald-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Globe2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">E-Lawyers Legal Portal</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Legal services and compliance support
                </p>
              </div>
              <ExternalLink className="ml-auto h-4 w-4 text-slate-400" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* 7. Social Channels */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5">
          <p className="text-xs font-semibold text-emerald-800">Official Publications &amp; Channels</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Follow our regulatory updates
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {SOCIAL_GROUPS.map((group) => {
            const accent =
              group.color === 'blue'
                ? 'text-blue-700 bg-blue-50'
                : 'text-emerald-700 bg-emerald-50';
            const hoverClass =
              group.color === 'blue'
                ? 'hover:border-blue-200 hover:bg-blue-50 hover:text-blue-900'
                : 'hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900';
            return (
              <article
                key={group.brand}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-black ${accent}`}
                  >
                    {group.brand === 'ACCOUNTICCA' ? 'A' : 'E'}
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-950">{group.brand}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">{group.description}</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {group.links.map(({ label, href, Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition ${hoverClass}`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" /> {label}{' '}
                      <ArrowUpRight className="h-3 w-3 text-slate-400" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 8. Office Map */}
      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <p className="text-xs font-semibold text-emerald-800">Dhaka Chambers Location</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Visit our Panthapath office
          </h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <OfficeLocationMap primaryPhone={PRIMARY_PHONE} rawTelNumber={RAW_PHONE} />
        </div>
      </section>

      <FloatingLiveChat />
    </main>
  );
}
