import { useState, useMemo, useCallback } from 'react';

/**
 * Standard Bangladeshi Mobile Number prefixes:
 * 013, 014 (Skitto/Banglalink), 015 (Teletalk), 016 (Airtel), 017 (Grameenphone), 018 (Robi), 019 (Banglalink)
 */
export const BD_PHONE_REGEX = /^(?:\+?880|880|0)?1[3-9]\d{8}$/;

/**
 * Standard RFC-compliant email regex
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validator function signatures
 */
export type ValidatorFn<T = any> = (value: T, allValues?: any) => string | null;

/**
 * Standard field validators
 */
export const validators = {
  required: (fieldLabel: string, minLength = 1): ValidatorFn<string> => {
    return (val: string) => {
      const trimmed = (val ?? '').trim();
      if (!trimmed) {
        return `${fieldLabel} is required.`;
      }
      if (trimmed.length < minLength) {
        return `${fieldLabel} must be at least ${minLength} characters.`;
      }
      return null;
    };
  },

  name: (fieldLabel = 'Full name', minLength = 2): ValidatorFn<string> => {
    return (val: string) => {
      const trimmed = (val ?? '').trim();
      if (!trimmed) {
        return `${fieldLabel} is required.`;
      }
      if (trimmed.length < minLength) {
        return `${fieldLabel} must be at least ${minLength} characters.`;
      }
      if (!/\p{L}/u.test(trimmed)) {
        return `${fieldLabel} must contain valid letters.`;
      }
      return null;
    };
  },

  email: (fieldLabel = 'Email address'): ValidatorFn<string> => {
    return (val: string) => {
      const trimmed = (val ?? '').trim();
      if (!trimmed) {
        return `${fieldLabel} is required.`;
      }
      if (trimmed.length > 254 || /\s/.test(trimmed)) {
        return 'Please enter a valid email without spaces.';
      }
      if (!EMAIL_REGEX.test(trimmed)) {
        return 'Please enter a valid corporate or personal email (e.g., name@company.com).';
      }
      const parts = trimmed.split('@');
      if (parts.length !== 2) {
        return 'Email must include a local name and domain (e.g., user@domain.com).';
      }
      const domain = parts[1];
      const domainParts = domain.split('.');
      if (domainParts.length < 2 || (domainParts[domainParts.length - 1] || '').length < 2) {
        return 'Please check the domain extension (e.g., .com, .org, .edu.bd).';
      }
      return null;
    };
  },

  phoneBD: (fieldLabel = 'Phone or WhatsApp number'): ValidatorFn<string> => {
    return (val: string) => {
      const trimmed = (val ?? '').trim();
      if (!trimmed) {
        return `${fieldLabel} is required.`;
      }
      // Strip formatting: spaces, hyphens, brackets, leading plus
      const cleaned = trimmed.replace(/[\s\-\(\)\.]/g, '');
      const digitsOnly = cleaned.replace(/\D/g, '');

      if (digitsOnly.length < 8) {
        return `${fieldLabel} must have at least 8 digits.`;
      }

      // Check if it's BD format
      if (BD_PHONE_REGEX.test(cleaned)) {
        return null;
      }

      // International number with 10-15 digits
      if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
        return null;
      }

      return 'Please enter an 11-digit Bangladesh number (e.g., 01712-345678) or international format.';
    };
  },

  password: (fieldLabel = 'Password', minLength = 6): ValidatorFn<string> => {
    return (val: string) => {
      const raw = val ?? '';
      if (!raw) {
        return `${fieldLabel} is required.`;
      }
      if (raw.length < minLength) {
        return `${fieldLabel} must be at least ${minLength} characters long.`;
      }
      return null;
    };
  },

  passwordConfirm: (passwordFieldKey = 'password', fieldLabel = 'Confirm password'): ValidatorFn<string> => {
    return (val: string, allValues?: any) => {
      const targetPass = allValues ? allValues[passwordFieldKey] : '';
      if (!val) {
        return `${fieldLabel} is required.`;
      }
      if (val !== targetPass) {
        return 'Passwords do not match. Please verify.';
      }
      return null;
    };
  },

  minLength: (min: number, fieldLabel = 'Field'): ValidatorFn<string> => {
    return (val: string) => {
      const trimmed = (val ?? '').trim();
      if (trimmed.length > 0 && trimmed.length < min) {
        return `${fieldLabel} must be at least ${min} characters (${trimmed.length}/${min}).`;
      }
      return null;
    };
  },

  maxLength: (max: number, fieldLabel = 'Field'): ValidatorFn<string> => {
    return (val: string) => {
      const trimmed = (val ?? '').trim();
      if (trimmed.length > max) {
        return `${fieldLabel} cannot exceed ${max} characters.`;
      }
      return null;
    };
  },

  url: (fieldLabel = 'URL', required = false): ValidatorFn<string> => {
    return (val: string) => {
      const trimmed = (val ?? '').trim();
      if (!trimmed) {
        return required ? `${fieldLabel} is required.` : null;
      }
      try {
        const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
        if (!parsed.hostname.includes('.')) {
          return 'Please enter a valid web domain address.';
        }
        return null;
      } catch {
        return 'Please enter a valid URL (e.g. https://linkedin.com/in/username).';
      }
    };
  }
};

/**
 * useRealtimeForm Hook for full-featured real-time validation across forms
 */
export interface UseRealtimeFormOptions<T extends Record<string, any>> {
  initialValues: T;
  validators: Partial<Record<keyof T, ValidatorFn | ValidatorFn[]>>;
  validateOnChange?: boolean;
}

export function useRealtimeForm<T extends Record<string, any>>({
  initialValues,
  validators: fieldValidators,
  validateOnChange = true,
}: UseRealtimeFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [formAttempted, setFormAttempted] = useState(false);

  // Validate a single field
  const runFieldValidation = useCallback((field: keyof T, val: any, currentValues: T): string | null => {
    const rules = fieldValidators[field];
    if (!rules) return null;

    if (Array.isArray(rules)) {
      for (const rule of rules) {
        const error = rule(val, currentValues);
        if (error) return error;
      }
      return null;
    }

    return rules(val, currentValues);
  }, [fieldValidators]);

  // Compute live errors for all fields
  const errors = useMemo<Partial<Record<keyof T, string>>>(() => {
    const errMap: Partial<Record<keyof T, string>> = {};
    for (const key in fieldValidators) {
      const error = runFieldValidation(key, values[key], values);
      if (error) {
        errMap[key] = error;
      }
    }
    return errMap;
  }, [values, fieldValidators, runFieldValidation]);

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  const setValue = useCallback((field: keyof T, val: any) => {
    setValues(prev => {
      const next = { ...prev, [field]: val };
      return next;
    });
    if (validateOnChange) {
      setTouched(prev => ({ ...prev, [field]: true }));
    }
  }, [validateOnChange]);

  const handleChange = useCallback((field: keyof T) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const target = e.target;
      const val = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
      setValue(field, val);
    };
  }, [setValue]);

  const handleBlur = useCallback((field: keyof T) => {
    return () => {
      setTouched(prev => ({ ...prev, [field]: true }));
    };
  }, []);

  const touchField = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const validateAll = useCallback((): boolean => {
    setFormAttempted(true);
    const allTouched: Partial<Record<keyof T, boolean>> = {};
    for (const key of Object.keys(values) as (keyof T)[]) {
      allTouched[key] = true;
    }
    setTouched(allTouched);

    return Object.keys(errors).length === 0;
  }, [values, errors]);

  const resetForm = useCallback((newInitialValues?: T) => {
    setValues(newInitialValues || initialValues);
    setTouched({});
    setFormAttempted(false);
  }, [initialValues]);

  // Helper for rendering input class states
  const getFieldFeedback = useCallback((field: keyof T) => {
    const isTouched = Boolean(touched[field] || formAttempted);
    const error = errors[field];
    const hasError = isTouched && Boolean(error);
    const isValidField = isTouched && !error && Boolean(values[field]);

    return {
      isTouched,
      hasError,
      isValidField,
      error: hasError ? error : null,
      feedbackId: `${String(field)}-feedback`
    };
  }, [touched, formAttempted, errors, values]);

  return {
    values,
    setValues,
    setValue,
    handleChange,
    handleBlur,
    touchField,
    touched,
    errors,
    isValid,
    formAttempted,
    setFormAttempted,
    validateAll,
    resetForm,
    getFieldFeedback
  };
}

/**
 * Returns clean Tailwind classes for input border/ring based on validation state
 */
export function getValidationInputClass(
  hasError: boolean,
  isValid: boolean,
  baseClasses = 'w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-900 transition-colors'
): string {
  if (hasError) {
    return `${baseClasses} border-rose-500 bg-rose-50/20 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500`;
  }
  if (isValid) {
    return `${baseClasses} border-emerald-500/80 bg-emerald-50/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600`;
  }
  return `${baseClasses} border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white`;
}
