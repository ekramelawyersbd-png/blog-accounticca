import React, { useEffect, useId, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  RotateCcw,
  Send,
  ShieldCheck,
  User,
} from 'lucide-react';
import { dispatchFormSubmissionToast } from './ui/FormSubmissionToast';

export type SupportField =
  | 'name'
  | 'email'
  | 'phone'
  | 'companyName'
  | 'department'
  | 'subject'
  | 'message';

export type SupportFormValues = Record<SupportField, string>;
export type SupportFieldErrors = Partial<Record<SupportField, string>>;

interface SupportConfigResponse {
  success?: boolean;
  supportEmail?: string;
  relayConfigured?: boolean;
  relayMode?: string;
}

interface SupportSubmitResult {
  status: 'delivered' | 'relay_failed';
  referenceId: string;
  supportEmail: string;
  messageId?: string;
  transport?: string;
  smtpNotice?: string | null;
  previewUrl?: string | null;
  message: string;
}

const SUPPORT_DEPARTMENTS = [
  'General & Advisory Support',
  'Tax, VAT & NBR Filing Support',
  'Corporate Law & RJSC Compliance',
  'Tax Tools, Calculators & Reports',
  'Account, Courses & Billing Help',
] as const;

const INITIAL_VALUES: SupportFormValues = {
  name: '',
  email: '',
  phone: '',
  companyName: '',
  department: SUPPORT_DEPARTMENTS[0],
  subject: '',
  message: '',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_REGEX = /^[a-zA-Z\s.'-]+$/;

function validateSupportField(field: SupportField, rawValue: string): string | undefined {
  const value = rawValue.trim();

  switch (field) {
    case 'name': {
      if (!value) return 'Full name is required.';
      if (value.length < 2 || value.length > 80) {
        return 'Full name must be between 2 and 80 characters.';
      }
      if (!NAME_REGEX.test(value)) {
        return 'Use letters, spaces, periods, hyphens, or apostrophes only.';
      }
      return undefined;
    }
    case 'email': {
      if (!value) return 'Email address is required.';
      if (value.length > 254 || !EMAIL_REGEX.test(value)) {
        return 'Enter a valid email address (e.g., name@company.com).';
      }
      return undefined;
    }
    case 'phone': {
      if (!value) return undefined;
      const digits = value.replace(/\D/g, '');
      if (digits.length < 8 || digits.length > 15) {
        return 'Phone number must contain 8–15 digits when provided.';
      }
      return undefined;
    }
    case 'companyName': {
      if (value.length > 120) {
        return 'Organization name must be 120 characters or fewer.';
      }
      return undefined;
    }
    case 'subject': {
      if (!value) return 'Please provide a clear subject line.';
      if (value.length < 4 || value.length > 140) {
        return 'Subject must be between 4 and 140 characters.';
      }
      return undefined;
    }
    case 'message': {
      if (!value) return 'Please describe your inquiry or support request.';
      if (value.length < 15) {
        return `Message must be at least 15 characters (${15 - value.length} more needed).`;
      }
      if (value.length > 3000) {
        return 'Message cannot exceed 3,000 characters.';
      }
      return undefined;
    }
    default:
      return undefined;
  }
}

function validateSupportForm(values: SupportFormValues): SupportFieldErrors {
  const errors: SupportFieldErrors = {};
  (Object.keys(values) as SupportField[]).forEach((field) => {
    const err = validateSupportField(field, values[field]);
    if (err) errors[field] = err;
  });
  return errors;
}

export interface SupportContactFormProps {
  className?: string;
  defaultDepartment?: string;
}

export const SupportContactForm: React.FC<SupportContactFormProps> = ({
  className = '',
  defaultDepartment,
}) => {
  const baseId = useId();
  const [values, setValues] = useState<SupportFormValues>(() => ({
    ...INITIAL_VALUES,
    department: defaultDepartment || SUPPORT_DEPARTMENTS[0],
  }));
  const [touched, setTouched] = useState<Partial<Record<SupportField, boolean>>>({});
  const [errors, setErrors] = useState<SupportFieldErrors>({});
  const [formErrorBanner, setFormErrorBanner] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SupportSubmitResult | null>(null);
  const [supportConfig, setSupportConfig] = useState<SupportConfigResponse | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/contact/support-config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SupportConfigResponse | null) => {
        if (active && data?.success) {
          setSupportConfig(data);
        }
      })
      .catch(() => {
        // Non-blocking diagnostic fetch
      });
    return () => {
      active = false;
    };
  }, []);

  const handleFieldChange = (field: SupportField, nextValue: string) => {
    setValues((prev) => ({ ...prev, [field]: nextValue }));
    if (formErrorBanner) setFormErrorBanner(null);

    if (touched[field]) {
      const nextError = validateSupportField(field, nextValue);
      setErrors((prev) => {
        const updated = { ...prev };
        if (nextError) {
          updated[field] = nextError;
        } else {
          delete updated[field];
        }
        return updated;
      });
    }
  };

  const handleFieldBlur = (field: SupportField) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const nextError = validateSupportField(field, values[field]);
    setErrors((prev) => {
      const updated = { ...prev };
      if (nextError) {
        updated[field] = nextError;
      } else {
        delete updated[field];
      }
      return updated;
    });
  };

  const resetForm = () => {
    setValues({
      ...INITIAL_VALUES,
      department: defaultDepartment || SUPPORT_DEPARTMENTS[0],
    });
    setTouched({});
    setErrors({});
    setFormErrorBanner(null);
    setSubmitResult(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const allTouched: Partial<Record<SupportField, boolean>> = {
      name: true,
      email: true,
      phone: true,
      companyName: true,
      department: true,
      subject: true,
      message: true,
    };
    setTouched(allTouched);

    const validationErrors = validateSupportForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setFormErrorBanner('Please fix the highlighted fields before sending your support message.');
      return;
    }

    setIsSubmitting(true);
    setFormErrorBanner(null);

    try {
      const response = await fetch('/api/contact/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          companyName: values.companyName.trim(),
          department: values.department,
          subject: values.subject.trim(),
          message: values.message.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 400 && data?.errors) {
        setErrors(data.errors as SupportFieldErrors);
        setFormErrorBanner(
          data.error || 'Some fields need correction before your message can be sent.'
        );
        return;
      }

      if (response.ok && data?.liveDelivered) {
        const result: SupportSubmitResult = {
          status: 'delivered',
          referenceId: data.referenceId || `SUP-${Date.now()}`,
          supportEmail: data.supportEmail || supportConfig?.supportEmail || 'support desk',
          messageId: data.messageId,
          transport: data.transport,
          message:
            data.message ||
            'Your support message has been dispatched via Brevo SMTP relay.',
        };
        setSubmitResult(result);
        dispatchFormSubmissionToast({
          title: 'Support message delivered',
          message: `Dispatched to ${result.supportEmail} via Brevo SMTP relay.`,
          referenceId: result.referenceId,
          recipientEmail: result.supportEmail,
          type: 'success',
        });
        return;
      }

      if (response.status === 502 && data?.savedLocally) {
        const result: SupportSubmitResult = {
          status: 'relay_failed',
          referenceId: data.referenceId || `SUP-${Date.now()}`,
          supportEmail: data.supportEmail || supportConfig?.supportEmail || 'support desk',
          messageId: data.messageId,
          transport: data.transport,
          smtpNotice: data.smtpNotice || data.error || 'Brevo SMTP relay failed.',
          previewUrl: data.previewUrl || null,
          message:
            data.message ||
            'Inquiry logged locally, but Brevo SMTP relay could not complete live delivery.',
        };
        setSubmitResult(result);
        dispatchFormSubmissionToast({
          title: 'Logged locally — Brevo relay error',
          message: result.smtpNotice || 'Check Brevo SMTP credentials or authorized IP.',
          referenceId: result.referenceId,
          recipientEmail: result.supportEmail,
          type: 'error',
        });
        return;
      }

      setFormErrorBanner(
        data?.error || data?.message || 'Unable to submit support message right now. Please try again.'
      );
    } catch (err: any) {
      setFormErrorBanner(
        err?.message || 'Network error while connecting to the support mail endpoint.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const messageLength = values.message.trim().length;
  const activeSupportEmail = supportConfig?.supportEmail;

  if (submitResult) {
    const isDelivered = submitResult.status === 'delivered';
    return (
      <div
        className={`rounded-3xl border ${
          isDelivered ? 'border-emerald-200 bg-white' : 'border-amber-200 bg-white'
        } p-6 sm:p-8 shadow-sm ${className}`}
        role="status"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                isDelivered
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {isDelivered ? (
                <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
              )}
            </span>
            <div>
              <p
                className={`text-xs font-bold uppercase tracking-wider ${
                  isDelivered ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {isDelivered ? 'Dispatched via Brevo SMTP Relay' : 'Saved Locally · Relay Delivery Issue'}
              </p>
              <h3 className="mt-1 text-xl font-bold text-slate-950">
                {isDelivered
                  ? 'Your support message has been sent'
                  : 'Inquiry recorded, but Brevo email delivery failed'}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{submitResult.message}</p>
            </div>
          </div>
        </div>

        <dl className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs sm:grid-cols-3">
          <div>
            <dt className="font-medium text-slate-500">Ticket Reference</dt>
            <dd className="mt-1 font-bold text-slate-900 tabular-nums">
              {submitResult.referenceId}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Support Recipient (.env)</dt>
            <dd className="mt-1 font-semibold text-slate-900 break-all">
              {submitResult.supportEmail}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Transport Status</dt>
            <dd className="mt-1 font-semibold text-slate-900 truncate">
              {submitResult.transport || (isDelivered ? 'brevo_smtp_relay' : 'relay_failed')}
            </dd>
          </div>
        </dl>

        {!isDelivered && submitResult.smtpNotice && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">
            <strong className="font-semibold">Brevo SMTP Notice:</strong> {submitResult.smtpNotice}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Send another message
          </button>
          {!isDelivered && (
            <button
              type="button"
              onClick={() => setSubmitResult(null)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
            >
              Edit &amp; retry submission
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 ${className}`}
    >
      <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Direct Support Mail Desk
          </p>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
            Send a direct support request
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Validated messages are routed directly via Brevo SMTP to our configured support desk.
          </p>
        </div>
        {activeSupportEmail && (
          <div className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2 text-xs font-semibold text-emerald-900">
            <ShieldCheck className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            <span>Routes to: {activeSupportEmail}</span>
          </div>
        )}
      </div>

      {formErrorBanner && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{formErrorBanner}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor={`${baseId}-name`}
              className="block text-sm font-semibold text-slate-800"
            >
              Full Name <span className="text-rose-600">*</span>
            </label>
            <div className="relative mt-1.5">
              <User
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id={`${baseId}-name`}
                name="name"
                type="text"
                autoComplete="name"
                value={values.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                onBlur={() => handleFieldBlur('name')}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? `${baseId}-name-err` : undefined}
                placeholder="Md. Tariqul Islam"
                className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 transition focus:outline-none focus:ring-4 ${
                  errors.name
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                    : 'border-slate-300 focus:border-emerald-700 focus:ring-emerald-700/10'
                }`}
              />
            </div>
            {errors.name && (
              <p id={`${baseId}-name-err`} className="mt-1.5 text-xs font-medium text-rose-600">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor={`${baseId}-email`}
              className="block text-sm font-semibold text-slate-800"
            >
              Email Address <span className="text-rose-600">*</span>
            </label>
            <div className="relative mt-1.5">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id={`${baseId}-email`}
                name="email"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                onBlur={() => handleFieldBlur('email')}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? `${baseId}-email-err` : undefined}
                placeholder="you@company.com"
                className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 transition focus:outline-none focus:ring-4 ${
                  errors.email
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                    : 'border-slate-300 focus:border-emerald-700 focus:ring-emerald-700/10'
                }`}
              />
            </div>
            {errors.email && (
              <p id={`${baseId}-email-err`} className="mt-1.5 text-xs font-medium text-rose-600">
                {errors.email}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor={`${baseId}-phone`}
              className="block text-sm font-semibold text-slate-800"
            >
              Phone / WhatsApp <span className="text-xs font-normal text-slate-500">(Optional)</span>
            </label>
            <div className="relative mt-1.5">
              <Phone
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id={`${baseId}-phone`}
                name="phone"
                type="tel"
                autoComplete="tel"
                value={values.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                onBlur={() => handleFieldBlur('phone')}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? `${baseId}-phone-err` : undefined}
                placeholder="+880 1XXX-XXXXXX"
                className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 transition focus:outline-none focus:ring-4 ${
                  errors.phone
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                    : 'border-slate-300 focus:border-emerald-700 focus:ring-emerald-700/10'
                }`}
              />
            </div>
            {errors.phone && (
              <p id={`${baseId}-phone-err`} className="mt-1.5 text-xs font-medium text-rose-600">
                {errors.phone}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor={`${baseId}-company`}
              className="block text-sm font-semibold text-slate-800"
            >
              Company / Organization{' '}
              <span className="text-xs font-normal text-slate-500">(Optional)</span>
            </label>
            <div className="relative mt-1.5">
              <Building2
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id={`${baseId}-company`}
                name="companyName"
                type="text"
                autoComplete="organization"
                value={values.companyName}
                onChange={(e) => handleFieldChange('companyName', e.target.value)}
                onBlur={() => handleFieldBlur('companyName')}
                aria-invalid={Boolean(errors.companyName)}
                aria-describedby={errors.companyName ? `${baseId}-company-err` : undefined}
                placeholder="Organization or entity name"
                className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 transition focus:outline-none focus:ring-4 ${
                  errors.companyName
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                    : 'border-slate-300 focus:border-emerald-700 focus:ring-emerald-700/10'
                }`}
              />
            </div>
            {errors.companyName && (
              <p
                id={`${baseId}-company-err`}
                className="mt-1.5 text-xs font-medium text-rose-600"
              >
                {errors.companyName}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor={`${baseId}-department`}
              className="block text-sm font-semibold text-slate-800"
            >
              Support Category
            </label>
            <select
              id={`${baseId}-department`}
              name="department"
              value={values.department}
              onChange={(e) => handleFieldChange('department', e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-700/10"
            >
              {SUPPORT_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={`${baseId}-subject`}
              className="block text-sm font-semibold text-slate-800"
            >
              Subject <span className="text-rose-600">*</span>
            </label>
            <input
              id={`${baseId}-subject`}
              name="subject"
              type="text"
              value={values.subject}
              onChange={(e) => handleFieldChange('subject', e.target.value)}
              onBlur={() => handleFieldBlur('subject')}
              aria-invalid={Boolean(errors.subject)}
              aria-describedby={errors.subject ? `${baseId}-subject-err` : undefined}
              placeholder="Brief summary of your question or issue"
              className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 transition focus:outline-none focus:ring-4 ${
                errors.subject
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                  : 'border-slate-300 focus:border-emerald-700 focus:ring-emerald-700/10'
              }`}
            />
            {errors.subject && (
              <p id={`${baseId}-subject-err`} className="mt-1.5 text-xs font-medium text-rose-600">
                {errors.subject}
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor={`${baseId}-message`}
              className="block text-sm font-semibold text-slate-800"
            >
              Message <span className="text-rose-600">*</span>
            </label>
            <span
              className={`text-xs tabular-nums ${
                messageLength > 3000 ? 'font-semibold text-rose-600' : 'text-slate-500'
              }`}
            >
              {messageLength} / 3,000
            </span>
          </div>
          <div className="relative mt-1.5">
            <MessageSquare
              className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <textarea
              id={`${baseId}-message`}
              name="message"
              rows={5}
              value={values.message}
              onChange={(e) => handleFieldChange('message', e.target.value)}
              onBlur={() => handleFieldBlur('message')}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? `${baseId}-message-err` : undefined}
              placeholder="Share details of your tax, legal, or platform support request (minimum 15 characters)..."
              className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-3.5 text-sm leading-6 text-slate-900 transition focus:outline-none focus:ring-4 ${
                errors.message
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                  : 'border-slate-300 focus:border-emerald-700 focus:ring-emerald-700/10'
              }`}
            />
          </div>
          {errors.message && (
            <p id={`${baseId}-message-err`} className="mt-1.5 text-xs font-medium text-rose-600">
              {errors.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500">
            Dispatched via Brevo SMTP relay with automatic reply-to routing to your email.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-700/20 disabled:cursor-not-allowed disabled:opacity-65 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Sending via Brevo...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden="true" />
                Send Support Message
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupportContactForm;
