import type { CareerApplicationData } from './careerEmailTemplate';
import { dispatchFormSubmissionToast } from '../components/ui/FormSubmissionToast';

export interface SubmittedCareerApplicationRecord {
  id: string;
  referenceId: string;
  position: string;
  department: string;
  candidateName: string;
  candidateEmail: string;
  phone: string;
  whatsapp?: string;
  location: string;
  highestQualification: string;
  institution: string;
  salary: string;
  submittedAt: string;
  hrNotified: boolean;
  hrEmails: string[];
  candidateNotified: boolean;
  emailTransport: string;
  status: 'Received' | 'Under Review' | 'Shortlisted' | 'Interview Scheduled';
  data?: CareerApplicationData;
}

const SUBMITTED_APPLICATIONS_STORAGE_KEY = 'elaw_submitted_career_applications_v1';

export function loadLocalCareerApplications(): SubmittedCareerApplicationRecord[] {
  try {
    const raw = localStorage.getItem(SUBMITTED_APPLICATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalCareerApplication(record: SubmittedCareerApplicationRecord): void {
  try {
    const current = loadLocalCareerApplications();
    const existingIdx = current.findIndex(
      a => a.referenceId.toLowerCase() === record.referenceId.toLowerCase()
    );
    if (existingIdx >= 0) {
      current[existingIdx] = record;
    } else {
      current.unshift(record);
    }
    localStorage.setItem(SUBMITTED_APPLICATIONS_STORAGE_KEY, JSON.stringify(current.slice(0, 100)));
  } catch {
    // ignore storage quota errors
  }
}

export function queryLocalCareerApplications(query: {
  refId?: string;
  email?: string;
}): SubmittedCareerApplicationRecord[] {
  const all = loadLocalCareerApplications();
  const refFilter = query.refId?.trim().toLowerCase();
  const emailFilter = query.email?.trim().toLowerCase();

  return all.filter(item => {
    if (refFilter && item.referenceId.toLowerCase() === refFilter) return true;
    if (emailFilter && item.candidateEmail.toLowerCase() === emailFilter) return true;
    return false;
  });
}

export async function submitCareerApplicationToApi(
  payload: CareerApplicationData & Record<string, any>
): Promise<{
  referenceId: string;
  candidateName: string;
  candidateEmail: string;
  hrEmails: string[];
  hrNotified: boolean;
  candidateNotified: boolean;
  liveDelivered: boolean;
  emailTransport: string;
  smtpNotice?: string | null;
  submittedAt: string;
}> {
  const nowIso = new Date().toISOString();
  const nowDisplay = new Date().toLocaleString();
  const defaultHrEmails = ['admin@blog.accounticca.com'];

  let workspaceAccessToken: string | undefined;
  let spreadsheetId: string | undefined;
  try {
    workspaceAccessToken = localStorage.getItem('workspace_google_access_token') || undefined;
    spreadsheetId = localStorage.getItem('elaw_recruitment_spreadsheet_id') || undefined;
  } catch {
    // ignore
  }

  const localRecord: SubmittedCareerApplicationRecord = {
    id: `appl-local-${Date.now()}`,
    referenceId: payload.applicationRefId,
    position: payload.position || 'Applicant',
    department: payload.department || 'General Recruitment',
    candidateName: payload.fullName,
    candidateEmail: payload.email.toLowerCase(),
    phone: payload.phone,
    whatsapp: payload.whatsapp,
    location: payload.location || 'Dhaka',
    highestQualification: payload.highestQualification || 'Graduate',
    institution: payload.institution || 'University',
    salary: payload.salary || 'Negotiable',
    submittedAt: nowIso,
    hrNotified: false,
    hrEmails: defaultHrEmails,
    candidateNotified: false,
    emailTransport: 'Pending server Brevo confirmation',
    status: 'Received',
    data: payload
  };

  // Save locally first so status lookup works immediately
  saveLocalCareerApplication(localRecord);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const res = await fetch('/api/careers/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        workspaceAccessToken,
        spreadsheetId
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      throw new Error(data?.error || `Submission failed with status ${res.status}.`);
    }

    if (data) {
      const confirmedRefId = data.applicationRefId || data.referenceId || payload.applicationRefId;
      const hrNotified = Boolean(data.hrNotified);
      const candidateNotified = Boolean(data.candidateNotified);
      const liveDelivered = hrNotified && candidateNotified;
      const confirmedReceipt = {
        referenceId: confirmedRefId,
        candidateName: data.candidateName || payload.fullName,
        candidateEmail: data.candidateEmail || payload.email,
        hrEmails: Array.isArray(data.hrEmails) && data.hrEmails.length > 0 ? data.hrEmails : defaultHrEmails,
        hrNotified,
        candidateNotified,
        liveDelivered,
        emailTransport: data.emailTransport || 'brevo_smtp_relay',
        smtpNotice: data.smtpNotice || null,
        submittedAt: data.submittedAt ? new Date(data.submittedAt).toLocaleString() : nowDisplay
      };

      saveLocalCareerApplication({
        ...localRecord,
        referenceId: confirmedRefId,
        submittedAt: data.submittedAt || nowIso,
        hrEmails: confirmedReceipt.hrEmails,
        hrNotified: confirmedReceipt.hrNotified,
        candidateNotified: confirmedReceipt.candidateNotified,
        emailTransport: confirmedReceipt.emailTransport
      });

      const bothSent = confirmedReceipt.hrNotified && confirmedReceipt.candidateNotified;
      dispatchFormSubmissionToast({
        title: bothSent
          ? 'Application Submitted & Emails Sent!'
          : 'Application Saved (Email Relay Notice)',
        position: `${payload.position || 'Career Application'} · E-Lawyers`,
        message: bothSent
          ? `Thank you, ${confirmedReceipt.candidateName}. Confirmation sent to ${confirmedReceipt.candidateEmail} and our HR inbox via Brevo.`
          : `Application ${confirmedReceipt.referenceId} saved. ${confirmedReceipt.smtpNotice || 'Brevo email delivery requires configured credentials.'}`,
        referenceId: confirmedReceipt.referenceId,
        recipientEmail: confirmedReceipt.candidateEmail,
        type: bothSent ? 'success' : 'info',
        durationMs: 9000,
      });

      return confirmedReceipt;
    }
  } catch (err: any) {
    console.warn('[Career Application API error]:', err);
    if (err instanceof Error && err.message && !err.message.includes('aborted') && !err.message.includes('Failed to fetch')) {
      throw err;
    }
  }

  const fallbackReceipt = {
    referenceId: payload.applicationRefId,
    candidateName: payload.fullName,
    candidateEmail: payload.email,
    hrEmails: defaultHrEmails,
    hrNotified: false,
    candidateNotified: false,
    liveDelivered: false,
    emailTransport: 'offline_local_saved (server unreachable)',
    smtpNotice: 'Could not reach the Brevo mail server endpoint. Application saved locally only.',
    submittedAt: nowDisplay
  };

  dispatchFormSubmissionToast({
    title: 'Application Saved Locally (Offline)',
    position: `${payload.position || 'Career Application'} · E-Lawyers`,
    message: `Could not reach the server to dispatch Brevo emails. Your Reference ID is ${fallbackReceipt.referenceId}.`,
    referenceId: fallbackReceipt.referenceId,
    recipientEmail: fallbackReceipt.candidateEmail,
    type: 'info',
    durationMs: 9000,
  });

  return fallbackReceipt;
}
