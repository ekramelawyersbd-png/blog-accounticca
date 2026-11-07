import { getAccessToken } from './workspaceAuth';
import { workspaceSheetsApi } from './workspaceService';

export const RECRUITMENT_SHEET_STORAGE_KEY = 'elaw_recruitment_spreadsheet_id';
export const RECRUITMENT_SHEET_TITLE_KEY = 'elaw_recruitment_spreadsheet_title';
export const RECRUITMENT_SHEET_SYNC_COUNT_KEY = 'elaw_recruitment_sheet_synced_count';

export const SHEET_TAB_NAME = 'Applications';

export const SHEET_HEADERS = [
  'Reference ID',
  'Submission Date',
  'Position / Track',
  'Candidate Full Name',
  'Email Address',
  'Contact Phone',
  'WhatsApp Number',
  'Present Location',
  'Highest Qualification',
  'Degree Program',
  'University / Institution',
  'Graduation Year',
  'Experience Summary',
  'Expected Salary',
  'Availability / Joining',
  'CV / Resume Document',
  'Application Status',
  'HR Notes & Rating'
];

export interface ApplicationRowData {
  referenceId: string;
  submissionDate?: string;
  position: string;
  candidateName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  location?: string;
  highestQualification?: string;
  degreeProgram?: string;
  institution?: string;
  graduationYear?: string;
  experienceSummary?: string;
  salary?: string;
  joinTime?: string;
  cvFileName?: string;
  status?: string;
  hrNotes?: string;
}

export function getStoredRecruitmentSheetId(): string | null {
  try {
    return localStorage.getItem(RECRUITMENT_SHEET_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

export function setStoredRecruitmentSheetId(id: string, title?: string): void {
  try {
    localStorage.setItem(RECRUITMENT_SHEET_STORAGE_KEY, id.trim());
    if (title) {
      localStorage.setItem(RECRUITMENT_SHEET_TITLE_KEY, title.trim());
    }
  } catch {
    // localStorage unavailable
  }
}

export function getStoredRecruitmentSheetTitle(): string {
  try {
    return localStorage.getItem(RECRUITMENT_SHEET_TITLE_KEY) || 'E-Lawyers - Recruitment Applications 2026';
  } catch {
    return 'E-Lawyers - Recruitment Applications 2026';
  }
}

export function formatApplicationToRow(app: ApplicationRowData): (string | number)[] {
  return [
    app.referenceId || '',
    app.submissionDate || new Date().toISOString().replace('T', ' ').substring(0, 16),
    app.position || 'General Applicant',
    app.candidateName || '',
    app.email || '',
    app.phone || '',
    app.whatsapp || app.phone || '',
    app.location || 'Dhaka, Bangladesh',
    app.highestQualification || 'Graduate',
    app.degreeProgram || 'N/A',
    app.institution || 'N/A',
    app.graduationYear || '2025',
    app.experienceSummary || 'Fresh Graduate',
    app.salary || 'Negotiable',
    app.joinTime || 'Immediate',
    app.cvFileName || 'CV_Submitted.pdf',
    app.status || 'Received / Under Review',
    app.hrNotes || ''
  ];
}

/**
 * Initializes the header row on the connected Google Sheet if not already present.
 */
export async function initializeRecruitmentSheetHeaders(
  spreadsheetId: string,
  token?: string
): Promise<{ success: boolean; initialized: boolean; message: string }> {
  const authToken = token || getAccessToken();
  if (!authToken) {
    throw new Error('Workspace Google access token is required. Please sign in to Google in /workspace.');
  }

  // 1. Check if first row contains headers
  try {
    const range = `${SHEET_TAB_NAME}!A1:R1`;
    const checkRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (checkRes.ok) {
      const data = await checkRes.json();
      if (Array.isArray(data.values) && data.values.length > 0 && data.values[0].length >= 3) {
        return { success: true, initialized: false, message: 'Sheet headers already present.' };
      }
    }
  } catch (err) {
    console.warn('Header verification check failed, attempting to write headers:', err);
  }

  // 2. Write headers to A1:R1
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${SHEET_TAB_NAME}!A1:R1`)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [SHEET_HEADERS]
      })
    }
  );

  if (!updateRes.ok) {
    // If the tab "Applications" does not exist, try writing to the default first tab "A1:R1"
    const fallbackRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:R1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [SHEET_HEADERS]
        })
      }
    );

    if (!fallbackRes.ok) {
      const errData = await fallbackRes.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Failed to initialize headers (${fallbackRes.status})`);
    }
  }

  return { success: true, initialized: true, message: 'Recruitment headers successfully initialized.' };
}

/**
 * Creates a brand new official Recruitment Google Spreadsheet, initializes headers, and returns its metadata.
 */
export async function createOfficialRecruitmentSpreadsheet(
  title: string = 'E-Lawyers - Recruitment Applications 2026',
  token?: string
): Promise<{ spreadsheetId: string; url: string; title: string }> {
  const authToken = token || getAccessToken();
  if (!authToken) {
    throw new Error('Please sign in with Google in /workspace to create spreadsheets.');
  }

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        {
          properties: {
            title: SHEET_TAB_NAME,
            gridProperties: {
              frozenRowCount: 1,
              columnCount: 20
            }
          }
        }
      ]
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to create recruitment spreadsheet (${res.status})`);
  }

  const meta = await res.json();
  const spreadsheetId = meta.spreadsheetId;

  // Initialize header row
  await initializeRecruitmentSheetHeaders(spreadsheetId, authToken);

  // Save in local storage
  setStoredRecruitmentSheetId(spreadsheetId, title);

  return {
    spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    title
  };
}

/**
 * Appends a single application row to the connected Google Spreadsheet.
 */
export async function appendApplicationToSheet(
  app: ApplicationRowData,
  explicitSheetId?: string,
  explicitToken?: string
): Promise<{ success: boolean; rowAppended: boolean; referenceId: string; message: string }> {
  const spreadsheetId = (explicitSheetId || getStoredRecruitmentSheetId() || '').trim();
  if (!spreadsheetId) {
    return {
      success: false,
      rowAppended: false,
      referenceId: app.referenceId,
      message: 'No recruitment spreadsheet is currently connected in Workspace.'
    };
  }

  const token = explicitToken || getAccessToken();
  if (!token) {
    return {
      success: false,
      rowAppended: false,
      referenceId: app.referenceId,
      message: 'Workspace Google access token is unavailable. Record is stored locally and can be synced in Workspace.'
    };
  }

  const rowValues = formatApplicationToRow(app);

  // Try appending to Applications tab first
  let appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_TAB_NAME)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [rowValues]
      })
    }
  );

  // Fallback to Sheet1 if Applications tab doesn't exist
  if (!appendRes.ok && appendRes.status === 400) {
    appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [rowValues]
        })
      }
    );
  }

  if (!appendRes.ok) {
    const err = await appendRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to append row to Google Sheet (${appendRes.status})`);
  }

  // Update synced counter
  try {
    const currentCount = parseInt(localStorage.getItem(RECRUITMENT_SHEET_SYNC_COUNT_KEY) || '0', 10);
    localStorage.setItem(RECRUITMENT_SHEET_SYNC_COUNT_KEY, String(currentCount + 1));
  } catch {
    // ignore
  }

  return {
    success: true,
    rowAppended: true,
    referenceId: app.referenceId,
    message: `Application ${app.referenceId} successfully appended to Google Sheet.`
  };
}

/**
 * Reads all rows from the Google Sheet to determine existing reference IDs.
 */
export async function fetchSheetReferenceIds(
  spreadsheetId: string,
  token?: string
): Promise<Set<string>> {
  const authToken = token || getAccessToken();
  if (!authToken) return new Set();

  try {
    const range = `${SHEET_TAB_NAME}!A2:A1000`;
    let res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (!res.ok) {
      // Fallback range
      res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A2:A1000`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
    }

    if (!res.ok) return new Set();

    const data = await res.json();
    const existing = new Set<string>();
    if (Array.isArray(data.values)) {
      data.values.forEach((row: any[]) => {
        if (row && row[0]) {
          existing.add(String(row[0]).trim());
        }
      });
    }
    return existing;
  } catch (err) {
    console.warn('Error reading existing sheet IDs:', err);
    return new Set();
  }
}

/**
 * Reconciles and batch syncs all applications from the server to the Google Sheet.
 */
export async function syncAllApplicationsToSheet(
  spreadsheetId?: string,
  token?: string
): Promise<{
  success: boolean;
  totalServerApps: number;
  newRowsAppended: number;
  alreadySynced: number;
  message: string;
}> {
  const targetId = (spreadsheetId || getStoredRecruitmentSheetId() || '').trim();
  if (!targetId) {
    throw new Error('Please enter or connect a valid Google Spreadsheet ID first.');
  }

  const authToken = token || getAccessToken();
  if (!authToken) {
    throw new Error('Google Workspace access token required. Please sign in to Google in /workspace.');
  }

  // 1. Ensure headers exist
  await initializeRecruitmentSheetHeaders(targetId, authToken);

  // 2. Fetch all local server applications
  const serverRes = await fetch('/api/careers/applications');
  if (!serverRes.ok) {
    throw new Error('Failed to fetch applications from recruitment server.');
  }
  const serverData = await serverRes.json();
  const allApps: any[] = Array.isArray(serverData.applications) ? serverData.applications : [];

  // 3. Fetch existing reference IDs from sheet
  const existingRefIds = await fetchSheetReferenceIds(targetId, authToken);

  // 4. Filter for applications not yet in the sheet
  const missingApps = allApps.filter(app => app.referenceId && !existingRefIds.has(app.referenceId.trim()));

  if (missingApps.length === 0) {
    try {
      localStorage.setItem(RECRUITMENT_SHEET_SYNC_COUNT_KEY, String(allApps.length));
    } catch {
      // ignore
    }
    return {
      success: true,
      totalServerApps: allApps.length,
      newRowsAppended: 0,
      alreadySynced: allApps.length,
      message: `All ${allApps.length} applications are already synchronized in Google Sheets.`
    };
  }

  // 5. Append missing rows in batches
  const rowsToAppend = missingApps.map(app => formatApplicationToRow({
    referenceId: app.referenceId,
    submissionDate: app.submittedAt ? new Date(app.submittedAt).toISOString().replace('T', ' ').substring(0, 16) : undefined,
    position: app.position || 'Applicant',
    candidateName: app.candidateName || app.fullName || '',
    email: app.email || '',
    phone: app.phone || '',
    whatsapp: app.whatsapp || app.phone || '',
    location: app.location || 'Dhaka, Bangladesh',
    highestQualification: app.highestQualification || 'Graduate',
    degreeProgram: app.degreeProgram || 'N/A',
    institution: app.institution || 'N/A',
    graduationYear: app.graduationYear || '2025',
    experienceSummary: app.workExperience || 'N/A',
    salary: app.salary || 'Negotiable',
    joinTime: app.joinTime || 'Immediate',
    cvFileName: app.cvFileName || 'CV.pdf',
    status: app.status || 'Received'
  }));

  let appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${targetId}/values/${encodeURIComponent(SHEET_TAB_NAME)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: rowsToAppend
      })
    }
  );

  if (!appendRes.ok && appendRes.status === 400) {
    appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${targetId}/values/A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: rowsToAppend
        })
      }
    );
  }

  if (!appendRes.ok) {
    const err = await appendRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to batch append rows (${appendRes.status})`);
  }

  const updatedTotal = existingRefIds.size + rowsToAppend.length;
  try {
    localStorage.setItem(RECRUITMENT_SHEET_SYNC_COUNT_KEY, String(updatedTotal));
  } catch {
    // ignore
  }

  return {
    success: true,
    totalServerApps: allApps.length,
    newRowsAppended: rowsToAppend.length,
    alreadySynced: existingRefIds.size,
    message: `Successfully synchronized ${rowsToAppend.length} new application(s) to Google Sheets! Total rows: ${updatedTotal}.`
  };
}
