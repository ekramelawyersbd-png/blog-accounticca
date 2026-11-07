import { getAccessToken } from './workspaceAuth';
import { ShopProduct, inferProductType } from '../data/shopProducts';

export const SHOP_SHEET_ID_KEY = 'elaw_shop_spreadsheet_id';
export const SHOP_SHEET_TITLE_KEY = 'elaw_shop_spreadsheet_title';
export const SHOP_SHEET_SYNC_COUNT_KEY = 'elaw_shop_sheet_sync_count';

export const SHOP_SHEET_HEADERS = [
  'Reference / SKU ID',
  'Timestamp / Updated At',
  'Record Type',
  'Category / Practice Area',
  'Product Type / Fulfillment',
  'Title / Order Summary',
  'Format / Specifications',
  'Unit / Original Price (BDT)',
  'Sale / Net Total (BDT)',
  'Discount / Promo Applied',
  'Customer / Maintainer Name',
  'Email Address',
  'Phone / WhatsApp',
  'Company / Organization',
  'Payment / TrxID / Governing Law',
  'Status'
];

export interface ShopOrderItemSummary {
  productId: string;
  slug: string;
  title: string;
  category: string;
  productType: string;
  format: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ShopOrderRecord {
  id: string;
  referenceId: string;
  recordType: 'Customer Order';
  customerName: string;
  email: string;
  phone: string;
  companyName: string;
  items: ShopOrderItemSummary[];
  orderSummary: string;
  primaryCategory: string;
  productTypeSummary: string;
  formatSummary: string;
  subtotal: number;
  discount: number;
  total: number;
  promoCode?: string;
  paymentMethod: string;
  trxId: string;
  authProvider: string;
  status: string;
  submittedAt: string;
  sheetSynced?: boolean;
  sheetSyncedAt?: string;
}

export function getStoredShopSheetId(): string | null {
  try {
    return localStorage.getItem(SHOP_SHEET_ID_KEY);
  } catch {
    return null;
  }
}

export function setStoredShopSheetId(spreadsheetId: string, title?: string): void {
  try {
    if (!spreadsheetId) {
      localStorage.removeItem(SHOP_SHEET_ID_KEY);
      localStorage.removeItem(SHOP_SHEET_TITLE_KEY);
      return;
    }
    localStorage.setItem(SHOP_SHEET_ID_KEY, spreadsheetId.trim());
    if (title) {
      localStorage.setItem(SHOP_SHEET_TITLE_KEY, title.trim());
    }
  } catch {
    // ignore storage errors
  }
}

export function getStoredShopSheetTitle(): string {
  try {
    return (
      localStorage.getItem(SHOP_SHEET_TITLE_KEY) ||
      'Accounticca × E-Lawyers — Shop Orders & Catalog Master 2026'
    );
  } catch {
    return 'Accounticca × E-Lawyers — Shop Orders & Catalog Master 2026';
  }
}

export function extractShopSpreadsheetId(input: string): string {
  const trimmed = (input || '').trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * Formats a Customer Order into the unified 16-column row structure
 */
export function formatShopOrderRow(order: Partial<ShopOrderRecord>): string[] {
  const refId = order.referenceId || `ACC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const timestamp = order.submittedAt
    ? new Date(order.submittedAt).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })
    : new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' });

  const items = Array.isArray(order.items) ? order.items : [];
  const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const orderSummary =
    order.orderSummary ||
    (items.length > 0
      ? items.map((i) => `${i.title} (×${i.quantity || 1})`).join('; ')
      : 'Digital Toolkit Order');

  const primaryCategory =
    order.primaryCategory ||
    (items.length === 1
      ? items[0].category
      : items.length > 1
      ? `Multi-Category (${items[0].category})`
      : 'Legal & Tax Digital Store');

  const productTypeSummary =
    order.productTypeSummary ||
    (items.length === 1
      ? items[0].productType || 'Templates'
      : items.length > 1
      ? `Multi-Item Order (${totalQty} items)`
      : 'Digital Procurement');

  const formatSummary =
    order.formatSummary ||
    (items.length === 1
      ? items[0].format
      : items.length > 1
      ? `${items.length} Digital Packages (DOCX / XLSX / PDF)`
      : 'Digital Download');

  const subtotalVal = Number(order.subtotal ?? order.total ?? 0);
  const netTotalVal = Number(order.total ?? 0);
  const discountVal = Number(order.discount ?? Math.max(0, subtotalVal - netTotalVal));

  const discountLabel =
    discountVal > 0
      ? `BDT ${discountVal.toLocaleString('en-IN')}${order.promoCode ? ` (${order.promoCode})` : ''}`
      : 'None (BDT 0)';

  const paymentSummary = `${order.paymentMethod || (netTotalVal === 0 ? 'Free Access' : 'bKash Personal')} | TrxID: ${
    order.trxId || (netTotalVal === 0 ? 'FREE-ORDER' : 'VERIFIED')
  }`;

  return [
    refId,
    timestamp,
    'Customer Order',
    primaryCategory,
    productTypeSummary,
    orderSummary,
    formatSummary,
    `BDT ${subtotalVal.toLocaleString('en-IN')}`,
    `BDT ${netTotalVal.toLocaleString('en-IN')}`,
    discountLabel,
    order.customerName || 'Verified Purchaser',
    order.email || '',
    order.phone || '',
    order.companyName || 'Direct Individual Client',
    paymentSummary,
    order.status || 'Completed Order'
  ];
}

/**
 * Formats a Catalog Product into the unified 16-column row structure
 */
export function formatShopProductRow(product: ShopProduct, updatedAtIso?: string): string[] {
  const skuId = product.id.startsWith('PRD-') ? product.id : `PRD-${product.id}`;
  const timestamp = updatedAtIso
    ? new Date(updatedAtIso).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })
    : new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' });

  const prodType = product.productType || inferProductType(product);
  const origPrice = Number(product.originalPrice || product.price || 0);
  const salePrice = Number(product.price || 0);
  const savings = Math.max(0, origPrice - salePrice);

  const discountBadge =
    savings > 0
      ? `Save BDT ${savings.toLocaleString('en-IN')}${product.badge ? ` • ${product.badge}` : ''}`
      : product.badge || 'Standard Rate';

  const statusLabel = product.status === 'draft' ? 'Draft Hidden' : 'Published Live';

  return [
    skuId,
    timestamp,
    'Catalog Product',
    product.category || 'Legal Contracts',
    prodType,
    product.title,
    `${product.format || 'DOCX + PDF'} (${product.pagesOrFiles || '1 Package'})`,
    `BDT ${origPrice.toLocaleString('en-IN')}`,
    `BDT ${salePrice.toLocaleString('en-IN')}`,
    discountBadge,
    product.authorOrVettedBy || 'Adv. Ekram Hossain',
    'shop@accounticca.com',
    '+8801335230170',
    'Accounticca × E-Lawyers Repository',
    product.governingLaw || 'Bangladesh Statutory Law (FY 2026-27)',
    statusLabel
  ];
}

/**
 * Creates a new Google Spreadsheet formatted for Shop Orders & Product Catalog
 */
export async function createOfficialShopSpreadsheet(
  title = 'Accounticca × E-Lawyers — Shop Orders & Catalog Master 2026',
  customToken?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; title: string }> {
  const token = customToken || getAccessToken();
  if (!token) {
    throw new Error('Google Workspace authorization is required. Please sign in to Google Workspace.');
  }

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        {
          properties: {
            title: 'Shop',
            gridProperties: {
              frozenRowCount: 1,
              rowCount: 1500,
              columnCount: 18
            }
          }
        }
      ]
    })
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to create Shop Google Sheet (${createRes.status})`);
  }

  const created = await createRes.json();
  const spreadsheetId: string = created.spreadsheetId;
  const spreadsheetUrl: string =
    created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  const sheetIdNumber = created.sheets?.[0]?.properties?.sheetId ?? 0;

  // Populate Row 1 with SHOP_SHEET_HEADERS
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Shop!A1:P1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [SHOP_SHEET_HEADERS]
      })
    }
  );

  // Format header row with executive dark navy background & white bold text
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
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
                endColumnIndex: SHOP_SHEET_HEADERS.length
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.06, green: 0.14, blue: 0.23 },
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    bold: true,
                    fontSize: 10
                  },
                  verticalAlignment: 'MIDDLE'
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,verticalAlignment)'
            }
          }
        ]
      })
    });
  } catch {
    // Non-blocking styling
  }

  setStoredShopSheetId(spreadsheetId, title);
  return { spreadsheetId, spreadsheetUrl, title };
}

/**
 * Ensures the connected spreadsheet has the 16-column header row initialized
 */
export async function initializeShopSheetHeaders(
  spreadsheetId: string,
  customToken?: string
): Promise<void> {
  const token = customToken || getAccessToken();
  if (!token || !spreadsheetId) return;

  const cleanId = extractShopSpreadsheetId(spreadsheetId);
  const getRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/A1:P1`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (getRes.ok) {
    const data = await getRes.json();
    if (!data.values || data.values.length === 0 || !data.values[0]?.[0]) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/A1:P1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: [SHOP_SHEET_HEADERS]
          })
        }
      );
    }
  } else {
    const err = await getRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Unable to access Spreadsheet (${getRes.status})`);
  }
}

/**
 * Appends a single Customer Order row to the connected Shop Google Sheet
 */
export async function appendShopOrderToSheet(
  order: Partial<ShopOrderRecord>,
  customToken?: string
): Promise<{ synced: boolean; spreadsheetId?: string; error?: string }> {
  const token = customToken || getAccessToken();
  let spreadsheetId = getStoredShopSheetId();

  if (!spreadsheetId) {
    try {
      const cfgRes = await fetch('/api/workspace/shop-sheet-config');
      if (cfgRes.ok) {
        const cfgData = await cfgRes.json();
        if (cfgData?.config?.spreadsheetId) {
          spreadsheetId = cfgData.config.spreadsheetId;
          setStoredShopSheetId(cfgData.config.spreadsheetId, cfgData.config.title);
        }
      }
    } catch {
      // ignore
    }
  }

  if (!token || !spreadsheetId) {
    return {
      synced: false,
      error: !spreadsheetId ? 'No Shop Google Sheet connected.' : 'No Workspace OAuth token active.'
    };
  }

  try {
    const row = formatShopOrderRow(order);
    let appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Shop:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: [row] })
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
          body: JSON.stringify({ values: [row] })
        }
      );
    }

    if (!appendRes.ok) {
      const err = await appendRes.json().catch(() => ({}));
      return {
        synced: false,
        spreadsheetId,
        error: err?.error?.message || `Sheets API error (${appendRes.status})`
      };
    }

    return { synced: true, spreadsheetId };
  } catch (err: any) {
    return { synced: false, spreadsheetId, error: err?.message || 'Network error' };
  }
}

/**
 * Appends a single Catalog Product row to the connected Shop Google Sheet
 */
export async function appendShopProductToSheet(
  product: ShopProduct,
  customToken?: string
): Promise<{ synced: boolean; spreadsheetId?: string; error?: string }> {
  const token = customToken || getAccessToken();
  let spreadsheetId = getStoredShopSheetId();

  if (!spreadsheetId) {
    try {
      const cfgRes = await fetch('/api/workspace/shop-sheet-config');
      if (cfgRes.ok) {
        const cfgData = await cfgRes.json();
        if (cfgData?.config?.spreadsheetId) {
          spreadsheetId = cfgData.config.spreadsheetId;
          setStoredShopSheetId(cfgData.config.spreadsheetId, cfgData.config.title);
        }
      }
    } catch {
      // ignore
    }
  }

  if (!token || !spreadsheetId) {
    return {
      synced: false,
      error: !spreadsheetId ? 'No Shop Google Sheet connected.' : 'No Workspace OAuth token active.'
    };
  }

  try {
    const row = formatShopProductRow(product);
    let appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Shop:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: [row] })
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
          body: JSON.stringify({ values: [row] })
        }
      );
    }

    if (!appendRes.ok) {
      const err = await appendRes.json().catch(() => ({}));
      return {
        synced: false,
        spreadsheetId,
        error: err?.error?.message || `Sheets API error (${appendRes.status})`
      };
    }

    return { synced: true, spreadsheetId };
  } catch (err: any) {
    return { synced: false, spreadsheetId, error: err?.message || 'Network error' };
  }
}

/**
 * Synchronizes all Shop Catalog Products and Customer Orders to the connected Google Sheet without duplicates
 */
export async function syncAllShopRecordsToSheet(
  spreadsheetId?: string,
  customToken?: string
): Promise<{
  totalRecords: number;
  ordersTotal: number;
  productsTotal: number;
  newAppended: number;
  alreadySynced: number;
  spreadsheetId: string;
  message: string;
}> {
  const token = customToken || getAccessToken();
  const targetSheetId = extractShopSpreadsheetId(spreadsheetId || getStoredShopSheetId() || '');

  if (!token) {
    throw new Error('Please connect your Google Workspace account first.');
  }
  if (!targetSheetId) {
    throw new Error('Please provide or create a Shop Google Spreadsheet first.');
  }

  await initializeShopSheetHeaders(targetSheetId, token);

  const syncRes = await fetch('/api/workspace/sync-shop-sheet', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      spreadsheetId: targetSheetId,
      token
    })
  });

  if (!syncRes.ok) {
    const errData = await syncRes.json().catch(() => ({}));
    throw new Error(errData?.error || errData?.details || 'Failed to synchronize Shop records to Google Sheet');
  }

  const result = await syncRes.json();
  try {
    localStorage.setItem(SHOP_SHEET_SYNC_COUNT_KEY, String(result.totalRecords || 0));
  } catch {
    // ignore
  }

  return {
    totalRecords: result.totalRecords || 0,
    ordersTotal: result.ordersTotal || 0,
    productsTotal: result.productsTotal || 0,
    newAppended: result.newAppended || 0,
    alreadySynced: result.alreadySynced || 0,
    spreadsheetId: targetSheetId,
    message: result.message || 'Shop Catalog and Customer Orders synchronized with Google Sheets.'
  };
}
