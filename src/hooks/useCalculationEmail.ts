import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  CalculationEmailPayload,
  CalculationEmailInputItem,
  CalculationEmailTable,
  CalculationEmailMetric,
  buildCalculationEmailTemplate,
  extractCalculationSnapshotFromContainer,
  generateCalculationReferenceId,
  getDefaultLegalNotesForTool,
  SentCalculationEmailRecord,
} from '../utils/calculationEmailTemplate';

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface UseCalculationEmailOptions {
  toolId: string;
  toolName: string;
  toolCategory?: string;
  toolPath?: string;
  statutoryBasis?: string;
  userEmail?: string | null;
  userName?: string | null;
  initialCcRecipients?: string[];
  initialCustomNote?: string;
  inputs?: CalculationEmailInputItem[];
  tables?: CalculationEmailTable[];
  summaryMetrics?: CalculationEmailMetric[];
  legalNotes?: string[];
  containerRef?: React.RefObject<HTMLElement | null>;
  customSnapshot?: Omit<
    CalculationEmailPayload,
    'primaryRecipient' | 'recipientName' | 'ccRecipients' | 'customNote'
  > | null;
}

export interface SendCalculationEmailParams {
  recipientEmail?: string;
  recipientName?: string;
  ccRecipients?: string[];
  customNote?: string;
  inputs?: CalculationEmailInputItem[];
  tables?: CalculationEmailTable[];
  summaryMetrics?: CalculationEmailMetric[];
  legalNotes?: string[];
}

export interface BrevoRelayStatus {
  host: string;
  port: number;
  login: string;
  senderName: string;
  senderEmail: string;
  formattedFrom: string;
  mode: string;
  status: string;
  configured: boolean;
  hasCredentials: boolean;
}

export interface DispatchedEmailConfirmation {
  referenceId: string;
  messageId: string;
  sentAt: string;
  recipients: string[];
  relayMode: string;
  fromHeader?: string;
  previewUrl?: string | null;
  record?: SentCalculationEmailRecord;
}

export function useCalculationEmail(options: UseCalculationEmailOptions) {
  const {
    toolId,
    toolName,
    toolCategory = 'Statutory Compliance & Tax',
    toolPath = '/tools',
    statutoryBasis,
    userEmail,
    userName,
    initialCcRecipients = [],
    initialCustomNote = '',
    inputs: propInputs,
    tables: propTables,
    summaryMetrics: propSummaryMetrics,
    legalNotes: propLegalNotes,
    containerRef,
    customSnapshot,
  } = options;

  const defaultPrimaryEmail = userEmail || 'ekram.elawyersbd@gmail.com';
  const [primaryEmail, setPrimaryEmail] = useState<string>(defaultPrimaryEmail);
  const [ccRecipients, setCcRecipients] = useState<string[]>(initialCcRecipients);
  const [ccInput, setCcInput] = useState<string>(initialCcRecipients.join(', '));
  const [customNote, setCustomNote] = useState<string>(initialCustomNote);
  const [snapshotTick, setSnapshotTick] = useState<number>(0);

  // Transmission and relay states
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isTestingRelay, setIsTestingRelay] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastConfirmation, setLastConfirmation] = useState<DispatchedEmailConfirmation | null>(null);

  // Live Brevo Relay configuration & state
  const [brevoRelay, setBrevoRelay] = useState<BrevoRelayStatus>({
    host: 'smtp-relay.brevo.com',
    port: 587,
    login: '9dabe5001@smtp-brevo.com',
    senderName: 'ACCOUNTICCA x E-Lawyers',
    senderEmail: 'ekram@elawyersbd.com',
    formattedFrom: '"ACCOUNTICCA x E-Lawyers" <ekram@elawyersbd.com>',
    mode: 'brevo_smtp_relay (smtp-relay.brevo.com:587 • 9dabe5001@smtp-brevo.com)',
    status: 'ready',
    configured: true,
    hasCredentials: true,
  });

  // Sync email when user signs in
  useEffect(() => {
    if (userEmail) {
      setPrimaryEmail(userEmail);
    }
  }, [userEmail]);

  // Parse CC input string whenever it changes
  useEffect(() => {
    const list = ccInput
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    setCcRecipients(list);
  }, [ccInput]);

  // Fetch current Brevo relay configuration from server
  const fetchBrevoStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/email/brevo-status');
      if (res.ok) {
        const data = await res.json();
        if (data?.host) {
          setBrevoRelay({
            host: data.host || 'smtp-relay.brevo.com',
            port: Number(data.port || 587),
            login: data.login || '9dabe5001@smtp-brevo.com',
            senderName: data.senderName || 'ACCOUNTICCA x E-Lawyers',
            senderEmail: data.senderEmail || 'ekram@elawyersbd.com',
            formattedFrom:
              data.formattedFrom ||
              data.fromHeader ||
              `"${data.senderName || 'ACCOUNTICCA x E-Lawyers'}" <${data.senderEmail || 'ekram@elawyersbd.com'}>`,
            mode: data.mode || `brevo_smtp_relay (${data.host || 'smtp-relay.brevo.com'}:${data.port || 587})`,
            status: data.status || 'ready',
            configured: Boolean(data.configured ?? true),
            hasCredentials: Boolean(data.hasCredentials ?? true),
          });
        }
      }
    } catch {
      // Non-blocking fallback
    }
  }, []);

  useEffect(() => {
    void fetchBrevoStatus();
  }, [fetchBrevoStatus]);

  // Check validity of CC emails
  const invalidCcEmails = useMemo(() => {
    return ccRecipients.filter((email) => !EMAIL_REGEX.test(email));
  }, [ccRecipients]);

  const isValidPrimaryEmail = useMemo(() => {
    return EMAIL_REGEX.test(primaryEmail.trim());
  }, [primaryEmail]);

  // Construct base calculation snapshot from props, customSnapshot, or container DOM
  const baseSnapshot = useMemo(() => {
    if (customSnapshot) {
      return customSnapshot;
    }

    if (propInputs || propTables || propSummaryMetrics) {
      const refId = generateCalculationReferenceId(toolId);
      const generatedAt = new Date().toLocaleString('en-BD', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      return {
        referenceId: refId,
        generatedAt,
        toolId,
        toolName,
        toolCategory,
        toolPath,
        statutoryBasis: statutoryBasis || getDefaultLegalNotesForTool(toolId, toolCategory)[0] || 'Income Tax Act 2023',
        summaryMetrics: propSummaryMetrics || [],
        inputs: propInputs || [],
        tables: propTables || [],
        legalNotes: propLegalNotes || getDefaultLegalNotesForTool(toolId, toolCategory),
      };
    }

    return extractCalculationSnapshotFromContainer(containerRef?.current || null, {
      toolId,
      toolName,
      toolCategory,
      toolPath,
      statutoryBasis,
    });
  }, [
    customSnapshot,
    propInputs,
    propTables,
    propSummaryMetrics,
    propLegalNotes,
    containerRef,
    toolId,
    toolName,
    toolCategory,
    toolPath,
    statutoryBasis,
    snapshotTick,
  ]);

  // Full compiled payload including recipient coordinates
  const payload: CalculationEmailPayload = useMemo(
    () => ({
      ...baseSnapshot,
      primaryRecipient: primaryEmail.trim() || defaultPrimaryEmail,
      recipientName: userName || 'Verified Member',
      ccRecipients: ccRecipients.filter((e) => EMAIL_REGEX.test(e)),
      customNote,
    }),
    [baseSnapshot, primaryEmail, defaultPrimaryEmail, userName, ccRecipients, customNote]
  );

  // Pre-compiled HTML & plain text for email transmission
  const compiledEmail = useMemo(() => buildCalculationEmailTemplate(payload), [payload]);

  // Re-snapshot inputs & tables from active calculator
  const refreshSnapshot = useCallback(() => {
    setSnapshotTick((t) => t + 1);
  }, []);

  /**
   * Dispatches the formatted calculation email through Brevo SMTP Relay
   */
  const sendEmail = useCallback(
    async (params?: SendCalculationEmailParams): Promise<DispatchedEmailConfirmation> => {
      setError(null);

      const targetPrimary = (params?.recipientEmail || primaryEmail).trim();
      const targetName = (params?.recipientName || payload.recipientName || 'Verified Member').trim();
      const targetCc = (params?.ccRecipients || payload.ccRecipients).filter((e) => EMAIL_REGEX.test(e));
      const targetNote = params?.customNote !== undefined ? params.customNote : customNote;

      if (!EMAIL_REGEX.test(targetPrimary)) {
        const err = 'Please enter a valid primary recipient email address.';
        setError(err);
        throw new Error(err);
      }

      if (invalidCcEmails.length > 0) {
        const err = `Invalid CC recipient email format: ${invalidCcEmails.join(', ')}`;
        setError(err);
        throw new Error(err);
      }

      // Merge dynamic parameters if provided in send call
      const finalPayload: CalculationEmailPayload = {
        ...payload,
        primaryRecipient: targetPrimary,
        recipientName: targetName,
        ccRecipients: targetCc,
        customNote: targetNote,
        inputs: params?.inputs || payload.inputs,
        tables: params?.tables || payload.tables,
        summaryMetrics: params?.summaryMetrics || payload.summaryMetrics,
        legalNotes: params?.legalNotes || payload.legalNotes,
      };

      const finalCompiled = buildCalculationEmailTemplate(finalPayload);
      const summaryHighlight =
        finalPayload.summaryMetrics[finalPayload.summaryMetrics.length - 1]?.value ||
        `${finalPayload.inputs.length} inputs · ${finalPayload.tables.length} table(s)`;

      setIsSending(true);

      try {
        let response: Response;
        try {
          response = await fetch('/api/email/send-calculation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              referenceId: finalPayload.referenceId,
              toolId: finalPayload.toolId,
              toolName: finalPayload.toolName,
              toolCategory: finalPayload.toolCategory,
              toolPath: finalPayload.toolPath,
              primaryRecipient: targetPrimary,
              recipientName: targetName,
              ccRecipients: targetCc,
              customNote: targetNote,
              subject: finalCompiled.subject,
              html: finalCompiled.html,
              text: finalCompiled.text,
              summaryHighlight,
            }),
          });
        } catch (fetchErr: any) {
          throw new Error(`Network connection error: ${fetchErr?.message || 'Server unreachable'}`);
        }

        const rawText = await response.text();
        let data: any = null;
        try {
          data = rawText ? JSON.parse(rawText) : null;
        } catch {
          // Response body was not valid JSON
        }

        if (!response.ok) {
          const errMsg =
            data?.error ||
            data?.message ||
            (rawText && rawText.length < 160 ? rawText : `Server responded with status ${response.status}`);
          throw new Error(errMsg);
        }

        if (!data || !data.success) {
          throw new Error(data?.error || data?.message || 'Failed to dispatch calculation email via Brevo relay.');
        }

        const confirmation: DispatchedEmailConfirmation = {
          referenceId: finalPayload.referenceId,
          messageId: data.messageId || `calc-mail-${Date.now()}`,
          sentAt: new Date().toLocaleTimeString(),
          recipients: [targetPrimary, ...targetCc],
          relayMode: data.relayMode || brevoRelay.mode,
          fromHeader: data.fromHeader || brevoRelay.formattedFrom,
          previewUrl: data.previewUrl || null,
          record: data.record,
        };

        setLastConfirmation(confirmation);
        return confirmation;
      } catch (err: any) {
        const errMsg = err?.message || 'Unable to send calculation email right now.';
        setError(errMsg);
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [payload, primaryEmail, customNote, invalidCcEmails, brevoRelay]
  );

  /**
   * Diagnostic verification test for Brevo SMTP relay
   */
  const testBrevoRelay = useCallback(
    async (targetRecipient?: string): Promise<{ success: boolean; message: string; messageId: string }> => {
      setError(null);
      const testEmail = (targetRecipient || primaryEmail).trim() || defaultPrimaryEmail;

      if (!EMAIL_REGEX.test(testEmail)) {
        const err = 'Please enter a valid recipient email to test Brevo relay.';
        setError(err);
        throw new Error(err);
      }

      setIsTestingRelay(true);

      try {
        let res: Response;
        try {
          res = await fetch('/api/email/brevo-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipientEmail: testEmail }),
          });
        } catch (fetchErr: any) {
          throw new Error(`Network connection error: ${fetchErr?.message || 'Server unreachable'}`);
        }

        const rawText = await res.text();
        let data: any = null;
        try {
          data = rawText ? JSON.parse(rawText) : null;
        } catch {
          // Non-JSON response
        }

        if (!res.ok) {
          const errMsg = data?.error || data?.message || `Relay test returned status ${res.status}`;
          throw new Error(errMsg);
        }

        if (!data || !data.success) {
          throw new Error(data?.error || 'Brevo diagnostic test failed.');
        }

        setLastConfirmation({
          referenceId: data.referenceId || 'DIAG-BREVO',
          messageId: data.messageId || 'OK',
          sentAt: new Date().toLocaleTimeString(),
          recipients: [testEmail],
          relayMode: data.transport || `${brevoRelay.host}:${brevoRelay.port}`,
          fromHeader: data.fromHeader || brevoRelay.formattedFrom,
          previewUrl: data.previewUrl || null,
        });

        return {
          success: true,
          message: data.message || `Diagnostic email dispatched to ${testEmail} via Brevo relay.`,
          messageId: data.messageId,
        };
      } catch (err: any) {
        const errMsg = err?.message || 'Could not reach Brevo diagnostic endpoint.';
        setError(errMsg);
        throw err;
      } finally {
        setIsTestingRelay(false);
      }
    },
    [primaryEmail, defaultPrimaryEmail, brevoRelay]
  );

  return {
    // Computed payload & formatted content
    payload,
    compiledEmail,
    subject: compiledEmail.subject,
    html: compiledEmail.html,
    text: compiledEmail.text,

    // Controlled inputs & state
    primaryEmail,
    setPrimaryEmail,
    ccInput,
    setCcInput,
    ccRecipients,
    setCcRecipients,
    customNote,
    setCustomNote,

    // Status flags & validation
    isValidPrimaryEmail,
    invalidCcEmails,
    isSending,
    isTestingRelay,
    error,
    lastConfirmation,

    // Relay metadata
    brevoRelay,
    fetchBrevoStatus,

    // Actions
    sendEmail,
    testBrevoRelay,
    refreshSnapshot,
  };
}

export default useCalculationEmail;
