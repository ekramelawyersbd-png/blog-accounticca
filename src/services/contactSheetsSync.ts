import { getAccessToken } from './workspaceAuth';

export const CONTACT_SHEET_STORAGE_KEY = 'elaw_contact_spreadsheet_id';
export const CONTACT_SHEET_TITLE_KEY = 'elaw_contact_spreadsheet_title';
export const CONTACT_SHEET_SYNC_COUNT_KEY = 'elaw_contact_sheet_synced_count';

export const CONTACT_SHEET_TAB_NAME = 'Requests';

export const CONTACT_SHEET_HEADERS = [
  'Reference ID',
  'Submitted At',
  'Request Type',
  'Division / Recipient',
  'Client Full Name',
  'Email Address',
  'Phone / WhatsApp',
  'Company / Organization',
  'Service / Practice Area',
  'Specific Expertise / Topic',
  'Consultation Mode',
  'Preferred Date',
  'Preferred Time Slot',
  'Assigned Partner / Chamber',
  'Matter Description / Agenda',
  'Status'
];

export interface ContactRequestRowData {
  referenceId: string;
  submittedAt?: string;
  requestType: 'Service Inquiry' | 'Consultation Meeting' | string;
  division?: string;
  clientName: string;
  email: string;
  phone: string;
  companyName?: string;
  serviceArea: string;
  expertiseTopic?: string;
  consultationMode?: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
  assignedPartner?: string;
  messageOrNotes?: string;
  status?: string;
}

/**
 * Extracts a clean Google Spreadsheet ID from either a raw ID string or a full Google Sheets URL.
 */
export function extractContactSpreadsheetId(input: string): string {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

export function getStoredContactSheetId(): string | null {
  try {
    return localStorage.getItem(CONTACT_SHEET_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

export function setStoredContactSheetId(id: string, title?: string): void {
  try {
    const cleanId = extractContactSpreadsheetId(id);
    if (cleanId) {
      localStorage.setItem(CONTACT_SHEET_STORAGE_KEY, cleanId);
    } else {
      localStorage.removeItem(CONTACT_SHEET_STORAGE_KEY);
    }
    if (title) {
      localStorage.setItem(CONTACT_SHEET_TITLE_KEY, title.trim());
    }
  } catch {
    // localStorage unavailable
  }
}

export function getStoredContactSheetTitle(): string {
  try {
    return (
      localStorage.getItem(CONTACT_SHEET_TITLE_KEY) ||
      'Accounticca × E-Lawyers — Contact & Meeting Requests 2026'
    );
  } catch {
    return 'Accounticca × E-Lawyers — Contact & Meeting Requests 2026';
  }
}

export function formatContactRequestToRow(req: ContactRequestRowData): (string | number)[] {
  return [
    req.referenceId || '',
    req.submittedAt || new Date().toISOString().replace('T', ' ').substring(0, 16),
    req.requestType || 'Service Inquiry',
    req.division || 'Accounticca × E-Lawyers',
    req.clientName || '',
    req.email || '',
    req.phone || '',
    req.companyName || 'Direct Client / Individual',
    req.serviceArea || 'General Advisory',
    req.expertiseTopic || 'General Service Inquiry',
    req.consultationMode || 'N/A (Written Inquiry)',
    req.preferredDate || 'Immediate / Written',
    req.preferredTimeSlot || 'N/A',
    req.assignedPartner || 'Advisory Routing Desk',
    req.messageOrNotes || '',
    req.status || (req.requestType === 'Consultation Meeting' ? 'Confirmed Booking' : 'New Inquiry')
  ];
}

/**
 * Initializes the 16-column header row on the connected Contact & Meetings Google Sheet.
 */
export async function initializeContactSheetHeaders(
  rawSpreadsheetId: string,
  token?: string
): Promise<{ success: boolean; initialized: boolean; message: string }> {
  const spreadsheetId = extractContactSpreadsheetId(rawSpreadsheetId);
  const authToken = token || getAccessToken();
  if (!authToken) {
    throw new Error('Workspace Google access token is required. Please sign in to Google in /workspace.');
  }

  // 1. Check if first row already contains headers
  try {
    const range = `${CONTACT_SHEET_TAB_NAME}!A1:P1`;
    const checkRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (checkRes.ok) {
      const data = await checkRes.json();
      if (Array.isArray(data.values) && data.values.length > 0 && data.values[0].length >= 3) {
        return { success: true, initialized: false, message: 'Contact & Meeting sheet headers already present.' };
      }
    }
  } catch (err) {
    console.warn('Contact sheet header check notice, attempting to write headers:', err);
  }

  // 2. Write headers to Requests!A1:P1 (or fallback to A1:P1 on first tab)
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${CONTACT_SHEET_TAB_NAME}!A1:P1`)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [CONTACT_SHEET_HEADERS]
      })
    }
  );

  if (!updateRes.ok) {
    const fallbackRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:P1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [CONTACT_SHEET_HEADERS]
        })
      }
    );

    if (!fallbackRes.ok) {
      const errData = await fallbackRes.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Failed to initialize Contact Sheet headers (${fallbackRes.status})`);
    }
  }

  return { success: true, initialized: true, message: 'Contact & Meetings headers initialized.' };
}

/**
 * Creates a brand new official Contact & Meeting Requests Google Spreadsheet, initializes headers, and returns its metadata.
 */
export async function createOfficialContactSpreadsheet(
  title: string = 'Accounticca × E-Lawyers — Contact & Meeting Requests 2026',
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
            title: CONTACT_SHEET_TAB_NAME,
            gridProperties: {
              frozenRowCount: 1,
              columnCount: 18
            }
          }
        }
      ]
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to create contact & meetings spreadsheet (${res.status})`);
  }

  const meta = await res.json();
  const spreadsheetId = meta.spreadsheetId;

  await initializeContactSheetHeaders(spreadsheetId, authToken);
  setStoredContactSheetId(spreadsheetId, title);

  return {
    spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    title
  };
}

/**
 * Appends a single Contact Inquiry or Consultation Meeting row to the connected Google Spreadsheet.
 */
export async function appendContactRequestToSheet(
  record: ContactRequestRowData,
  explicitSheetId?: string,
  explicitToken?: string
): Promise<{ success: boolean; rowAppended: boolean; referenceId: string; message: string }> {
  const spreadsheetId = extractContactSpreadsheetId(explicitSheetId || getStoredContactSheetId() || '');
  if (!spreadsheetId) {
    return {
      success: false,
      rowAppended: false,
      referenceId: record.referenceId,
      message: 'No Contact & Meetings spreadsheet is currently connected in Workspace.'
    };
  }

  const token = explicitToken || getAccessToken();
  if (!token) {
    return {
      success: false,
      rowAppended: false,
      referenceId: record.referenceId,
      message: 'Workspace Google access token is unavailable. Request is stored on the server and can be synced in Workspace.'
    };
  }

  const rowValues = formatContactRequestToRow(record);

  let appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(CONTACT_SHEET_TAB_NAME)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
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
    throw new Error(err?.error?.message || `Failed to append contact request to Google Sheet (${appendRes.status})`);
  }

  try {
    const currentCount = parseInt(localStorage.getItem(CONTACT_SHEET_SYNC_COUNT_KEY) || '0', 10);
    localStorage.setItem(CONTACT_SHEET_SYNC_COUNT_KEY, String(currentCount + 1));
  } catch {
    // ignore
  }

  return {
    success: true,
    rowAppended: true,
    referenceId: record.referenceId,
    message: `Request ${record.referenceId} successfully appended to Google Sheet.`
  };
}

/**
 * Reads all existing Reference IDs in Column A of the connected Contact & Meetings Google Sheet.
 */
export async function fetchContactSheetReferenceIds(
  rawSpreadsheetId: string,
  token?: string
): Promise<Set<string>> {
  const spreadsheetId = extractContactSpreadsheetId(rawSpreadsheetId);
  const authToken = token || getAccessToken();
  if (!authToken || !spreadsheetId) return new Set();

  try {
    const range = `${CONTACT_SHEET_TAB_NAME}!A2:A1000`;
    let res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (!res.ok) {
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
    console.warn('Error reading existing contact sheet reference IDs:', err);
    return new Set();
  }
}

/**
 * Reconciles and batch syncs all Contact Inquiries and Consultation Meetings from the server to the Google Sheet.
 */
export async function syncAllContactRequestsToSheet(
  spreadsheetId?: string,
  token?: string
): Promise<{
  success: boolean;
  totalServerRequests: number;
  newRowsAppended: number;
  alreadySynced: number;
  message: string;
}> {
  const targetId = extractContactSpreadsheetId(spreadsheetId || getStoredContactSheetId() || '');
  if (!targetId) {
    throw new Error('Please enter or connect a valid Contact & Meetings Google Spreadsheet ID first.');
  }

  const authToken = token || getAccessToken();
  if (!authToken) {
    throw new Error('Google Workspace access token required. Please sign in to Google in /workspace.');
  }

  // 1. Ensure headers exist on sheet
  await initializeContactSheetHeaders(targetId, authToken);

  // 2. Call server sync endpoint which reconciles and marks records synced
  const syncRes = await fetch('/api/workspace/sync-contact-sheet', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify({
      spreadsheetId: targetId,
      token: authToken
    })
  });

  if (!syncRes.ok) {
    const errData = await syncRes.json().catch(() => ({}));
    throw new Error(errData?.details || errData?.error || 'Failed to synchronize contact requests to Google Sheet.');
  }

  const result = await syncRes.json();
  try {
    localStorage.setItem(CONTACT_SHEET_SYNC_COUNT_KEY, String(result.total || 0));
  } catch {
    // ignore
  }

  return {
    success: true,
    totalServerRequests: result.total || 0,
    newRowsAppended: result.newAppended || 0,
    alreadySynced: result.alreadySynced || 0,
    message:
      result.message ||
      `Successfully synchronized ${result.newAppended || 0} request(s) to Google Sheets.`
  };
}
