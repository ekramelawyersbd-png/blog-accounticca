import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  CalculationEmailPayload,
  extractCalculationSnapshotFromContainer,
} from '../utils/calculationEmailTemplate';
import { CalculationEmailModal } from '../components/tools/CalculationEmailModal';
import { useAuth } from './AuthContext';

export interface OpenEmailPreviewOptions {
  toolId?: string;
  toolName?: string;
  toolCategory?: string;
  toolPath?: string;
  statutoryBasis?: string;
  containerRef?: React.RefObject<HTMLElement | null>;
  customSnapshot?: Omit<
    CalculationEmailPayload,
    'primaryRecipient' | 'recipientName' | 'ccRecipients' | 'customNote'
  > | null;
}

export interface EmailPreviewContextType {
  /**
   * Opens the global email preview modal with the provided tool parameters or container snapshot
   */
  openEmailPreview: (options?: OpenEmailPreviewOptions) => void;
  /**
   * Closes the global email preview modal
   */
  closeEmailPreview: () => void;
  /**
   * Whether the global email preview modal is currently open
   */
  isOpen: boolean;
  /**
   * Current active tool configuration for the preview
   */
  currentOptions: OpenEmailPreviewOptions | null;
}

const EmailPreviewContext = createContext<EmailPreviewContextType | undefined>(undefined);

export interface EmailPreviewProviderProps {
  children: React.ReactNode;
}

export const EmailPreviewProvider: React.FC<EmailPreviewProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentOptions, setCurrentOptions] = useState<OpenEmailPreviewOptions | null>(null);

  const openEmailPreview = useCallback((options?: OpenEmailPreviewOptions) => {
    if (options) {
      setCurrentOptions(options);
    }
    setIsOpen(true);
  }, []);

  const closeEmailPreview = useCallback(() => {
    setIsOpen(false);
  }, []);

  const resolvedToolId = currentOptions?.toolId || 'tax-calculator';
  const resolvedToolName = currentOptions?.toolName || 'Bangladesh Statutory Compliance Calculator';
  const resolvedToolCategory = currentOptions?.toolCategory || 'Taxation & Statutory Compliance';
  const resolvedToolPath = currentOptions?.toolPath || (typeof window !== 'undefined' ? window.location.pathname : '/tax-calculator');
  const resolvedStatutoryBasis = currentOptions?.statutoryBasis;

  const value = useMemo(
    () => ({
      openEmailPreview,
      closeEmailPreview,
      isOpen,
      currentOptions,
    }),
    [openEmailPreview, closeEmailPreview, isOpen, currentOptions]
  );

  return (
    <EmailPreviewContext.Provider value={value}>
      {children}

      <CalculationEmailModal
        isOpen={isOpen}
        onClose={closeEmailPreview}
        toolId={resolvedToolId}
        toolName={resolvedToolName}
        toolCategory={resolvedToolCategory}
        toolPath={resolvedToolPath}
        statutoryBasis={resolvedStatutoryBasis}
        userEmail={user?.email}
        userName={user?.displayName}
        containerRef={currentOptions?.containerRef}
        customSnapshot={currentOptions?.customSnapshot}
      />
    </EmailPreviewContext.Provider>
  );
};

export function useEmailPreview(): EmailPreviewContextType {
  const context = useContext(EmailPreviewContext);
  if (!context) {
    throw new Error('useEmailPreview must be used within an EmailPreviewProvider');
  }
  return context;
}
