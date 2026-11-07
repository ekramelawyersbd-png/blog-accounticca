import { getAccessToken } from './workspaceAuth';
import { CalculationEmailReportRecord } from './calculationReportFirestoreService';

export const CALCULATION_SHEET_ID_KEY = 'elaw_calculation_spreadsheet_id';
export const CALCULATION_SHEET_TITLE_KEY = 'elaw_calculation_spreadsheet_title';
export const CALCULATION_SHEET_SYNC_COUNT_KEY = 'elaw_calculation_sheet_sync_count';

export const CALCULATION_SHEET_HEADERS = [
  'Reference ID',
  'Timestamp (BST)',
  'Calculator Type',
  'Compliance Discipline',
  'Primary Recipient',
  'CC Recipient(s)',
  'Key Summary Highlight',
  'Relay Transport (Brevo)',
  'Subject Line',
  'Delivery Status',
  'Tool URL Path',
];

export function getStoredCalculationSheetId(): string | null {
  try {
    return (
      localStorage.getItem(CALCULATION_SHEET_ID_KEY) ||
      localStorage.getItem('elaw_shop_spreadsheet_id') ||
      null
    );
  } catch {
    return null;
  }
}

export function setStoredCalculationSheetId(spreadsheetId: string, title?: string): void {
  try {
    if (!spreadsheetId) {
      localStorage.removeItem(CALCULATION_SHEET_ID_KEY);
      localStorage.removeItem(CALCULATION_SHEET_TITLE_KEY);
      return;
    }
    localStorage.setItem(CALCULATION_SHEET_ID_KEY, spreadsheetId.trim());
    if (title) {
      localStorage.setItem(CALCULATION_SHEET_TITLE_KEY, title.trim());
    }
  } catch {}
}

export function getStoredCalculationSheetTitle(): string {
  try {
    return (
      localStorage.getItem(CALCULATION_SHEET_TITLE_KEY) ||
      'Accounticca × E-Lawyers — Calculation Email Reports Ledger 2026'
    );
  } catch {
    return 'Accounticca × E-Lawyers — Calculation Email Reports Ledger 2026';
  }
}

export function extractSpreadsheetId(input: string): string {
  const trimmed = (input || '').trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * Formats a single calculation report into the Google Sheets row array
 */
export function formatCalculationReportRow(report: CalculationEmailReportRecord): string[] {
  const ccString = Array.isArray(report.ccRecipients) && report.ccRecipients.length > 0
    ? report.ccRecipients.join(', ')
    : 'None';

  return [
    report.referenceId || report.id,
    report.formattedDate || report.sentAt,
    report.calculatorType || report.toolName,
    report.toolCategory || 'Compliance & Tax',
    report.primaryRecipient,
    ccString,
    report.summaryHighlight || 'Completed Report',
    report.relayMode || 'smtp-relay.brevo.com:587',
    report.subject || `[${report.referenceId}] Calculation Report`,
    report.status || 'Delivered',
    report.toolPath || '/tools',
  ];
}

/**
 * Creates a dedicated Calculation Reports Google Spreadsheet in Google Drive
 */
export async function createOfficialCalculationSpreadsheet(
  title = 'Accounticca × E-Lawyers — Statutory Calculation Email Reports 2026',
  customToken?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; title: string }> {
  const token = customToken || getAccessToken();
  if (!token) {
    throw new Error('Google Workspace authorization is required. Please sign in to Google Workspace in /workspace.');
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
            title: 'Calculation Reports',
            gridProperties: {
              frozenRowCount: 1,
              rowCount: 1000,
              columnCount: CALCULATION_SHEET_HEADERS.length + 2,
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
  const spreadsheetUrl: string =
    created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  const sheetIdNumber = created.sheets?.[0]?.properties?.sheetId ?? 0;

  // Insert Header Row
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Calculation Reports'!A1:K1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [CALCULATION_SHEET_HEADERS],
      }),
    }
  );

  // Apply dark navy header styling
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheetIdNumber,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: CALCULATION_SHEET_HEADERS.length,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.06, green: 0.14, blue: 0.23 },
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    bold: true,
                    fontSize: 10,
                  },
                  verticalAlignment: 'MIDDLE',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,verticalAlignment)',
            },
          },
        ],
      }),
    });
  } catch {}

  setStoredCalculationSheetId(spreadsheetId, title);
  return { spreadsheetId, spreadsheetUrl, title };
}

/**
 * Appends a list of calculation reports to the connected Google Spreadsheet
 */
export async function syncCalculationReportsToSheet(
  reports: CalculationEmailReportRecord[],
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

  let spreadsheetId = extractSpreadsheetId(targetSpreadsheetId || getStoredCalculationSheetId() || '');

  // If no spreadsheet exists yet, create one automatically
  if (!spreadsheetId) {
    const created = await createOfficialCalculationSpreadsheet(undefined, token);
    spreadsheetId = created.spreadsheetId;
  }

  // Format report rows
  const rows = reports.map(formatCalculationReportRow);
  if (rows.length === 0) {
    return {
      success: true,
      syncedCount: 0,
      spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    };
  }

  // 1. Try appending to 'Calculation Reports' sheet
  let appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Calculation Reports'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  let appendRes = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: rows }),
  });

  // If sheet 'Calculation Reports' didn't exist in a pre-existing sheet, fallback to Sheet1 or default tab
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
    throw new Error(err?.error?.message || `Failed to sync reports to Google Sheet (${appendRes.status})`);
  }

  // Store sync count
  try {
    const prev = parseInt(localStorage.getItem(CALCULATION_SHEET_SYNC_COUNT_KEY) || '0', 10);
    localStorage.setItem(CALCULATION_SHEET_SYNC_COUNT_KEY, String(prev + rows.length));
  } catch {}

  return {
    success: true,
    syncedCount: rows.length,
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  };
}

/**
 * Exports calculation reports to a downloadable CSV file
 */
export function exportCalculationReportsCsv(reports: CalculationEmailReportRecord[]): void {
  const rows = reports.map(formatCalculationReportRow);
  const allRows = [CALCULATION_SHEET_HEADERS, ...rows];

  const csvContent = allRows
    .map((row) =>
      row
        .map((cell) => {
          const escaped = String(cell || '').replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    )
    .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `accounticca-calculation-email-reports-${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
