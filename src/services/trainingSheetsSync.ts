import { getAccessToken } from './workspaceAuth';
import { TrainingAdmissionRecord } from './trainingAdmissionFirestoreService';

export const TRAINING_SHEET_ID_KEY = 'elaw_training_admission_spreadsheet_id';
export const TRAINING_SHEET_TITLE_KEY = 'elaw_training_admission_spreadsheet_title';

export const TRAINING_SHEET_HEADERS = [
  'Application ID',
  'Applied Timestamp (BST)',
  'Applicant Name',
  'Email Address',
  'Phone / WhatsApp',
  'Selected Course Name',
  'Course ID',
  'Academic Qualification',
  'Professional Experience',
  'Approval Status',
  'Approved Timestamp',
];

export function getStoredTrainingSheetId(): string | null {
  try {
    return localStorage.getItem(TRAINING_SHEET_ID_KEY) || localStorage.getItem('elaw_calculation_spreadsheet_id') || null;
  } catch {
    return null;
  }
}

export function setStoredTrainingSheetId(spreadsheetId: string, title?: string): void {
  try {
    if (!spreadsheetId) {
      localStorage.removeItem(TRAINING_SHEET_ID_KEY);
      localStorage.removeItem(TRAINING_SHEET_TITLE_KEY);
      return;
    }
    localStorage.setItem(TRAINING_SHEET_ID_KEY, spreadsheetId.trim());
    if (title) {
      localStorage.setItem(TRAINING_SHEET_TITLE_KEY, title.trim());
    }
  } catch {}
}

export function formatTrainingAdmissionRow(rec: TrainingAdmissionRecord): string[] {
  return [
    rec.id,
    rec.appliedAt ? new Date(rec.appliedAt).toLocaleString('en-BD') : '',
    rec.applicantName,
    rec.email,
    rec.phone,
    rec.courseName,
    rec.courseId,
    rec.qualification,
    rec.experience,
    rec.status.toUpperCase(),
    rec.approvedAt ? new Date(rec.approvedAt).toLocaleString('en-BD') : 'Pending',
  ];
}

export async function createTrainingAdmissionSpreadsheet(
  title = 'Accounticca × E-Lawyers — Training Admissions & Approvals 2026',
  customToken?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; title: string }> {
  const token = customToken || getAccessToken();
  if (!token) {
    throw new Error('Google Workspace authorization required. Sign in to Google Workspace in /workspace.');
  }

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        {
          properties: {
            title: 'Training Admissions',
            gridProperties: {
              frozenRowCount: 1,
              rowCount: 1000,
              columnCount: TRAINING_SHEET_HEADERS.length + 2,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to create Google Sheet (${createRes.status})`);
  }

  const created = await createRes.json();
  const spreadsheetId: string = created.spreadsheetId;
  const spreadsheetUrl = created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  setStoredTrainingSheetId(spreadsheetId, title);

  // Insert Header Row
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Training Admissions'!A1:K1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [TRAINING_SHEET_HEADERS],
      }),
    }
  );

  return { spreadsheetId, spreadsheetUrl, title };
}

export async function syncTrainingAdmissionsToSheet(
  admissions: TrainingAdmissionRecord[],
  targetSpreadsheetId?: string,
  customToken?: string
): Promise<{
  success: boolean;
  syncedCount: number;
  spreadsheetId: string;
  spreadsheetUrl: string;
}> {
  const token = customToken || getAccessToken();
  if (!token) {
    throw new Error('Google Workspace access token not found. Please connect Google Workspace.');
  }

  let spreadsheetId = (targetSpreadsheetId || getStoredTrainingSheetId() || '').trim();
  if (!spreadsheetId) {
    const created = await createTrainingAdmissionSpreadsheet(undefined, token);
    spreadsheetId = created.spreadsheetId;
  }

  const rows = admissions.map(formatTrainingAdmissionRow);
  if (rows.length === 0) {
    return {
      success: true,
      syncedCount: 0,
      spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    };
  }

  let appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Training Admissions'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  let appendRes = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: rows }),
  });

  if (!appendRes.ok) {
    appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    appendRes = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: rows }),
    });
  }

  if (!appendRes.ok) {
    const err = await appendRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to sync training admissions to Google Sheet (${appendRes.status})`);
  }

  return {
    success: true,
    syncedCount: rows.length,
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  };
}
