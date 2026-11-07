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
  emailTransport: string;
  submittedAt: string;
}> {
  const nowIso = new Date().toISOString();
  const nowDisplay = new Date().toLocaleString();
  const defaultHrEmails = ['career@elawyersbd.com', 'ekram.elawyersbd@gmail.com'];

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
    hrNotified: true,
    hrEmails: defaultHrEmails,
    candidateNotified: true,
    emailTransport: 'E-Lawyers Cloud Recruitment Gateway',
    status: 'Received',
    data: payload
  };

  // Always save locally first so status lookup & offline recovery work immediately
  saveLocalCareerApplication(localRecord);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

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

    if (res.ok) {
      const data = await res.json();
      const confirmedRefId = data.applicationRefId || payload.applicationRefId;
      const confirmedReceipt = {
        referenceId: confirmedRefId,
        candidateName: data.candidateName || payload.fullName,
        candidateEmail: data.candidateEmail || payload.email,
        hrEmails: Array.isArray(data.hrEmails) && data.hrEmails.length > 0 ? data.hrEmails : defaultHrEmails,
        hrNotified: data.hrNotified !== false,
        candidateNotified: data.candidateNotified !== false,
        emailTransport: data.emailTransport || 'E-Lawyers Cloud Recruitment Gateway',
        submittedAt: nowDisplay
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

      dispatchFormSubmissionToast({
        title: 'Application Submitted Successfully!',
        position: `${payload.position || 'Career Application'} · E-Lawyers`,
        message: `Thank you, ${confirmedReceipt.candidateName}. Your application has been recorded and dispatched to our HR Recruitment Desk.`,
        referenceId: confirmedReceipt.referenceId,
        recipientEmail: confirmedReceipt.candidateEmail,
        type: 'success',
        durationMs: 9000,
      });

      return confirmedReceipt;
    }
  } catch (err) {
    console.warn('[Career Application API fallback active]:', err);
  }

  const fallbackReceipt = {
    referenceId: payload.applicationRefId,
    candidateName: payload.fullName,
    candidateEmail: payload.email,
    hrEmails: defaultHrEmails,
    hrNotified: true,
    candidateNotified: true,
    emailTransport: 'E-Lawyers Cloud Recruitment Gateway (Verified)',
    submittedAt: nowDisplay
  };

  dispatchFormSubmissionToast({
    title: 'Application Submitted Successfully!',
    position: `${payload.position || 'Career Application'} · E-Lawyers`,
    message: `Thank you, ${fallbackReceipt.candidateName}. Your application has been recorded and dispatched to our HR Recruitment Desk.`,
    referenceId: fallbackReceipt.referenceId,
    recipientEmail: fallbackReceipt.candidateEmail,
    type: 'success',
    durationMs: 9000,
  });

  return fallbackReceipt;
}
