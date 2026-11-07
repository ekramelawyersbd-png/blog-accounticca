import React, { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FormSuccessNotification,
  FormSuccessNotificationProps,
} from './FormSuccessNotification';

export { FormSuccessNotification };
export type { FormSuccessNotificationProps };

export interface FormSubmissionToastPayload {
  title: string;
  message: string;
  referenceId?: string;
  recipientEmail?: string;
  position?: string;
  type?: 'success' | 'info' | 'error';
  durationMs?: number;
}

const FORM_SUBMITTED_EVENT = 'elaw:form-submitted';

export function dispatchFormSubmissionToast(payload: FormSubmissionToastPayload): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<FormSubmissionToastPayload>(FORM_SUBMITTED_EVENT, {
      detail: payload,
    })
  );
}

interface ActiveToast extends FormSubmissionToastPayload {
  id: string;
  createdAt: number;
}

export function FormSubmissionToast() {
  const [toast, setToast] = useState<ActiveToast | null>(null);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    const handleEvent = (event: Event) => {
      const customEvent = event as CustomEvent<FormSubmissionToastPayload>;
      if (!customEvent.detail) return;
      setToast({
        ...customEvent.detail,
        type: customEvent.detail.type || 'success',
        durationMs: customEvent.detail.durationMs || 8000,
        id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: Date.now(),
      });
    };

    window.addEventListener(FORM_SUBMITTED_EVENT, handleEvent);
    return () => {
      window.removeEventListener(FORM_SUBMITTED_EVENT, handleEvent);
    };
  }, []);

  return (
    <AnimatePresence mode="wait">
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: -28, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 28,
          }}
          className="fixed top-20 right-4 sm:right-6 z-[9999] w-[calc(100vw-2rem)] max-w-md pointer-events-auto"
        >
          <FormSuccessNotification
            isVisible={true}
            variant="floating"
            type={toast.type || 'success'}
            title={toast.title}
            subtitle={toast.position}
            message={toast.message}
            referenceId={toast.referenceId}
            recipientEmail={toast.recipientEmail}
            autoHideDurationMs={toast.durationMs || 8000}
            onDismiss={dismissToast}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

