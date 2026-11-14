import React, { useEffect, useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Check, ExternalLink, X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalGoogleCalendarAction {
  /** Pre-filled Google Calendar event URL */
  href: string;
  /** Optional handler invoked alongside opening Google Calendar (e.g. Workspace Calendar sync) */
  onSync?: () => void;
  /** Whether the appointment/event has already been synced */
  isSynced?: boolean;
  /** Default label before syncing (defaults to "Sync with Google Calendar") */
  label?: string;
  /** Label shown once synced (defaults to "Synced with Google Calendar") */
  syncedLabel?: string;
}

export interface ModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback triggered when closing via Close button, Escape key, or backdrop */
  onClose: () => void;
  /** Optional heading rendered inside the modal */
  title?: React.ReactNode;
  /** Optional eyebrow label rendered above the title (e.g. Reference ID) */
  eyebrow?: React.ReactNode;
  /** Optional supporting copy rendered under the title */
  description?: React.ReactNode;
  /** Optional centered icon element rendered at the top of the modal */
  icon?: React.ReactNode;
  /** Main modal body content */
  children?: React.ReactNode;
  /** Custom footer node (replaces default action bar when provided) */
  footer?: React.ReactNode;
  /** Built-in Google Calendar sync action button configuration */
  googleCalendarAction?: ModalGoogleCalendarAction;
  /** Whether to render an explicit footer Close button (defaults to true when googleCalendarAction is set) */
  showCloseAction?: boolean;
  /** Label for the explicit footer Close button (defaults to "Close") */
  closeActionLabel?: string;
  /** Whether to render the top-right dismiss X button (defaults to true) */
  showCloseIcon?: boolean;
  /** Close modal when clicking outside on the backdrop (defaults to true) */
  closeOnBackdrop?: boolean;
  /** Close modal when pressing Escape (defaults to true) */
  closeOnEscape?: boolean;
  /** Lock page scroll while modal is open (defaults to true) */
  lockBodyScroll?: boolean;
  /** Max width preset (defaults to "md") */
  size?: ModalSize;
  /** Optional custom aria-labelledby ID override */
  titleId?: string;
  /** Optional extra classes for the modal card */
  className?: string;
}

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
};

/**
 * Reusable accessible modal dialog component.
 * Supports general dialog content as well as post-submission confirmation boxes
 * with explicit "Sync with Google Calendar" and "Close" action buttons.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  eyebrow,
  description,
  icon,
  children,
  footer,
  googleCalendarAction,
  showCloseAction,
  closeActionLabel = 'Close',
  showCloseIcon = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  lockBodyScroll = true,
  size = 'md',
  titleId,
  className = '',
}) => {
  const generatedId = useId();
  const headingId = titleId || `modal-title-${generatedId}`;

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  useEffect(() => {
    if (!isOpen || !lockBodyScroll) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, lockBodyScroll]);

  const shouldRenderFooterActions =
    footer !== undefined
      ? true
      : Boolean(googleCalendarAction) || Boolean(showCloseAction);

  const shouldShowCloseButton =
    showCloseAction !== undefined
      ? showCloseAction
      : Boolean(googleCalendarAction);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? headingId : undefined}
          onClick={closeOnBackdrop ? onClose : undefined}
        >
          <motion.div
            key="modal-panel"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 30,
              mass: 0.8,
            }}
            onClick={(event) => event.stopPropagation()}
            className={`relative w-full ${SIZE_CLASSES[size]} rounded-3xl border border-emerald-200/80 bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto ${className}`}
          >
            {showCloseIcon && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {(icon || eyebrow || title || description) && (
              <div className="text-center space-y-3">
                {icon && (
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
                    {icon}
                  </div>
                )}

                {eyebrow && (
                  <div className="text-xs font-semibold text-emerald-800">
                    {eyebrow}
                  </div>
                )}

                {title && (
                  <h3
                    id={headingId}
                    className="text-2xl font-bold tracking-tight text-slate-950"
                  >
                    {title}
                  </h3>
                )}

                {description && (
                  <p className="text-sm leading-6 text-slate-600">
                    {description}
                  </p>
                )}
              </div>
            )}

            {children && <div>{children}</div>}

            {shouldRenderFooterActions && (
              <div className="pt-1">
                {footer !== undefined ? (
                  footer
                ) : (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {googleCalendarAction && (
                      <a
                        href={googleCalendarAction.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => googleCalendarAction.onSync?.()}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors"
                      >
                        {googleCalendarAction.isSynced ? (
                          <Check className="w-4 h-4 shrink-0" />
                        ) : (
                          <Calendar className="w-4 h-4 shrink-0" />
                        )}
                        <span>
                          {googleCalendarAction.isSynced
                            ? googleCalendarAction.syncedLabel || 'Synced with Google Calendar'
                            : googleCalendarAction.label || 'Sync with Google Calendar'}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
                      </a>
                    )}

                    {shouldShowCloseButton && (
                      <button
                        type="button"
                        onClick={onClose}
                        className={`${
                          googleCalendarAction ? 'sm:w-auto' : 'w-full'
                        } inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-800 transition-colors cursor-pointer`}
                      >
                        {closeActionLabel}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
