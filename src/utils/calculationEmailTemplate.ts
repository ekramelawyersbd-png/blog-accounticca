export interface CalculationEmailInputItem {
  label: string;
  value: string;
  note?: string;
}

export type CalculationTableRowTone =
  | 'default'
  | 'subtotal'
  | 'limit'
  | 'rebate'
  | 'highlight'
  | 'tds';

export interface CalculationEmailTableRow {
  cells: string[];
  tone?: CalculationTableRowTone;
}

export interface CalculationEmailTable {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: CalculationEmailTableRow[];
}

export interface CalculationEmailMetric {
  label: string;
  value: string;
  sublabel?: string;
  tone?: 'blue' | 'emerald' | 'amber' | 'indigo' | 'slate';
}

export interface CalculationEmailPayload {
  referenceId: string;
  generatedAt: string;
  toolId: string;
  toolName: string;
  toolCategory: string;
  toolPath: string;
  statutoryBasis: string;
  primaryRecipient: string;
  recipientName?: string;
  ccRecipients: string[];
  customNote?: string;
  summaryMetrics: CalculationEmailMetric[];
  inputs: CalculationEmailInputItem[];
  tables: CalculationEmailTable[];
  legalNotes: string[];
}

export interface SentCalculationEmailRecord {
  id: string;
  referenceId: string;
  toolId: string;
  toolName: string;
  toolCategory: string;
  toolPath: string;
  primaryRecipient: string;
  ccRecipients: string[];
  subject: string;
  sentAt: string;
  status: 'Dispatched' | 'Delivered';
  relayMode?: string;
  summaryHighlight?: string;
}

export function generateCalculationReferenceId(toolId: string = 'CALC'): string {
  const prefix = toolId
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 4)
    .toUpperCase() || 'CALC';
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-2026-${rand}`;
}

export function getDefaultLegalNotesForTool(toolId: string, toolCategory: string): string[] {
  const idLower = (toolId || '').toLowerCase();
  const catLower = (toolCategory || '').toLowerCase();

  if (idLower.includes('tax') || idLower.includes('rebate') || idLower.includes('slab') || catLower.includes('tax')) {
    return [
      'Initial Tax-Free Thresholds (AY 2026–2027): Tk. 4,00,000 for General Taxpayers; Tk. 4,50,000 for Female & Senior Citizens (65+); Tk. 5,25,000 for Third Gender & Disabled Taxpayers; Tk. 5,50,000 for Gazetted War-Wounded Freedom Fighters & July 2024 Injured Fighters (+Tk. 50,000 per disabled child/dependant).',
      'Section 78 Three-Limit Investment Rebate Rule: Allowable Tax Rebate is the lowest of Limit A (3% of eligible total taxable income), Limit B (10% of total allowable investment under Part 3 of the 6th Schedule), or Limit C (Tk. 7,50,000 maximum cap).',
      'Mandatory Holding Period Condition: Investments in Sanchayapatra (capped at Tk. 5,00,000), DPS (capped at Tk. 1,20,000/yr), Mutual Funds, and ETFs must be held until statutory maturity to retain tax rebate eligibility.',
      'Section 86 Monthly Salary TDS & Minimum Tax Floor: Employers withhold monthly TDS equal to 1/12th of estimated annual net tax payable. Net payable tax cannot fall below the applicable jurisdictional minimum tax floor (Tk. 5,000 / Tk. 4,000 / Tk. 3,000 / Tk. 1,000).',
    ];
  }

  if (idLower.includes('vat') || idLower.includes('wht') || idLower.includes('tds') || catLower.includes('vat')) {
    return [
      'VAT & Supplementary Duty Act 2012 Compliance: Input tax credit (Rebate) requires valid Mushak-6.3 tax invoices, banking channel settlement for supplies ≥ Tk. 1,00,000, and inclusion in the Mushak-9.1 monthly return within the 15th of the following month.',
      'Withholding VAT (VDS) & Source Tax Rules: Deducting authorities must issue Mushak-6.6 / TDS certificates within statutory timelines and deposit withheld amounts to the Government Treasury via e-Challan (A-Challan).',
    ];
  }

  if (idLower.includes('rjsc') || idLower.includes('company') || catLower.includes('corporate') || catLower.includes('rjsc')) {
    return [
      'Companies Act 1994 & RJSC Filing Schedule: Registration fees, stamp duties, and certified copy charges are computed based on Authorized Share Capital tiers and statutory filing schedules.',
      'Post-Incorporation Statutory Deadlines: Annual Return (Schedule X) must be filed within 21 days of AGM, and audited financial statements must carry a valid ICAB Document Verification Code (DVC).',
    ];
  }

  if (idLower.includes('gratuity') || idLower.includes('stamp') || catLower.includes('labour') || catLower.includes('property')) {
    return [
      'Bangladesh Labour Act 2006 & Income Tax Act 2023: Statutory gratuity is calculated at 30 days (or 45 days for >10 years service) of last drawn basic salary per completed year, with tax exemption up to Tk. 2.50 Crore under the 6th Schedule.',
      'Stamp Act 1899 & Registration Act 1908: Instrument stamp duty and registration fees must be paid via treasury challan or non-judicial stamps prior to execution.',
    ];
  }

  return [
    'Statutory Compliance Notice: This calculation report is generated in accordance with applicable Bangladesh statutes for Assessment Year 2026–2027 (Income Tax Act 2023, Finance Act, VAT & SD Act 2012, and Companies Act 1994).',
    'Audit & Record Retention: Keep a copy of this computation statement alongside supporting bank statements, investment certificates, and treasury challans for statutory assessment.',
  ];
}

function classifyRowTone(rowText: string): CalculationTableRowTone {
  const lower = rowText.toLowerCase();
  if (
    lower.includes('final annual net tax') ||
    lower.includes('final net tax') ||
    lower.includes('total payable') ||
    lower.includes('net payable') ||
    lower.includes('grand total') ||
    lower.includes('final tax payable')
  ) {
    return 'highlight';
  }
  if (lower.includes('monthly salary tds') || lower.includes('monthly tds') || lower.includes('/ mo')) {
    return 'tds';
  }
  if (lower.includes('rebate') || lower.includes('less:') || lower.includes('exemption') || lower.includes('deduction')) {
    return 'rebate';
  }
  if (lower.includes('limit a') || lower.includes('limit b') || lower.includes('limit c')) {
    return 'limit';
  }
  if (lower.includes('gross tax') || lower.includes('subtotal') || lower.includes('minimum tax floor')) {
    return 'subtotal';
  }
  return 'default';
}

/**
 * Automatically extracts current input parameters, summary metrics, and breakdown tables
 * from an active calculator DOM container so any tool in /tools can generate a rich email report.
 */
export function extractCalculationSnapshotFromContainer(
  container: HTMLElement | null,
  meta: {
    toolId: string;
    toolName: string;
    toolCategory: string;
    toolPath: string;
    statutoryBasis?: string;
  }
): Omit<CalculationEmailPayload, 'primaryRecipient' | 'recipientName' | 'ccRecipients' | 'customNote'> {
  const referenceId = generateCalculationReferenceId(meta.toolId);
  const generatedAt = new Date().toLocaleString('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const statutoryBasis =
    meta.statutoryBasis || 'Bangladesh Income Tax Act 2023 · VAT & SD Act 2012 · AY 2026–2027';

  const inputs: CalculationEmailInputItem[] = [];
  const tables: CalculationEmailTable[] = [];
  const summaryMetrics: CalculationEmailMetric[] = [];

  if (container) {
    // 1. Extract inputs & selects
    const formControls = Array.from(
      container.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), select'
      )
    );

    const seenLabels = new Set<string>();

    formControls.forEach((ctrl) => {
      // Skip search boxes or modal inputs
      if (ctrl.closest('[role="dialog"]') || ctrl.getAttribute('placeholder')?.toLowerCase().includes('search')) {
        return;
      }

      let labelText = ctrl.getAttribute('aria-label') || '';
      let noteText = '';

      const parentDiv = ctrl.parentElement;
      if (parentDiv) {
        const labelEl = parentDiv.querySelector('label');
        if (labelEl && labelEl.textContent) {
          labelText = labelEl.textContent.trim();
        } else {
          // Check flex header row (common in TaxCalculator: <div><span>Label</span><span>Value</span></div>)
          const firstChild = parentDiv.firstElementChild;
          if (firstChild && firstChild !== ctrl) {
            const spans = Array.from(firstChild.querySelectorAll('span'));
            if (spans.length >= 2) {
              labelText = spans[0].textContent?.trim() || labelText;
              noteText = spans[1].textContent?.trim() || '';
            } else if (firstChild.textContent) {
              labelText = firstChild.textContent.trim();
            }
          }
        }
      }

      labelText = labelText.replace(/\s+/g, ' ').trim();
      if (!labelText) return;

      let displayValue = '';
      if (ctrl instanceof HTMLSelectElement) {
        const selectedOpt = ctrl.options[ctrl.selectedIndex];
        displayValue = selectedOpt ? selectedOpt.text.trim() : ctrl.value;
      } else {
        const rawVal = ctrl.value?.trim();
        if (ctrl.type === 'number') {
          const num = Number(rawVal || 0);
          displayValue = isNaN(num) ? rawVal : `৳ ${num.toLocaleString()}`;
          if (labelText.toLowerCase().includes('child') || labelText.toLowerCase().includes('dependant') || labelText.toLowerCase().includes('year') || labelText.toLowerCase().includes('rate') || labelText.toLowerCase().includes('%')) {
            displayValue = isNaN(num) ? rawVal : num.toLocaleString();
          }
        } else {
          displayValue = rawVal || '0';
        }
      }

      const dedupeKey = `${labelText}:${displayValue}`;
      if (!seenLabels.has(dedupeKey) && inputs.length < 24) {
        seenLabels.add(dedupeKey);
        inputs.push({
          label: labelText,
          value: displayValue,
          note: noteText || undefined,
        });
      }
    });

    // 2. Extract tables
    const domTables = Array.from(container.querySelectorAll<HTMLTableElement>('table'));
    domTables.forEach((tbl, tIdx) => {
      if (tbl.closest('[role="dialog"]')) return;

      // Try to find table title from preceding heading
      let tableTitle =
        tIdx === 0
          ? `${meta.toolName} — Statutory Calculation Breakdown`
          : `Reference & Compliance Schedule #${tIdx + 1}`;
      const wrapper = tbl.parentElement;
      if (wrapper) {
        const heading = wrapper.querySelector('h2, h3, h4');
        if (heading?.textContent?.trim()) {
          tableTitle = heading.textContent.replace(/\s+/g, ' ').trim();
        }
      }

      const headers: string[] = [];
      const ths = Array.from(tbl.querySelectorAll('thead th'));
      ths.forEach((th) => {
        headers.push((th.textContent || '').replace(/\s+/g, ' ').trim());
      });

      const rows: CalculationEmailTableRow[] = [];
      const trs = Array.from(tbl.querySelectorAll('tbody tr'));
      trs.forEach((tr) => {
        const tds = Array.from(tr.querySelectorAll('td'));
        if (tds.length === 0) return;

        const cells: string[] = [];
        tds.forEach((td) => {
          // Clone td without tooltip popovers so tooltip text doesn't pollute cell text
          const clone = td.cloneNode(true) as HTMLElement;
          clone.querySelectorAll('[role="tooltip"], button').forEach((el) => el.remove());
          const cleanText = (clone.textContent || '').replace(/\s+/g, ' ').trim();
          const colSpan = Number(td.getAttribute('colspan') || 1);
          if (colSpan > 1 && headers.length > 2) {
            cells.push(cleanText);
            for (let c = 1; c < colSpan; c++) {
              cells.push('');
            }
          } else {
            cells.push(cleanText);
          }
        });

        const joined = cells.join(' ');
        const tone = classifyRowTone(joined);
        rows.push({ cells, tone });

        // Also populate summaryMetrics from key rows in the primary table
        if (tIdx === 0 && (tone === 'highlight' || tone === 'tds' || tone === 'rebate' || tone === 'subtotal')) {
          const nonEmpty = cells.filter(Boolean);
          if (nonEmpty.length >= 2 && summaryMetrics.length < 4) {
            summaryMetrics.push({
              label: nonEmpty[0].replace(/:$/, ''),
              value: nonEmpty[nonEmpty.length - 1],
              tone:
                tone === 'highlight'
                  ? 'amber'
                  : tone === 'tds'
                  ? 'indigo'
                  : tone === 'rebate'
                  ? 'emerald'
                  : 'blue',
            });
          }
        }
      });

      if (rows.length > 0) {
        tables.push({
          title: tableTitle,
          headers: headers.length > 0 ? headers : ['Particulars / Statutory Step', 'Value / Amount'],
          rows,
        });
      }
    });
  }

  // Fallback sample data if triggered from /tools hub or before inputs are populated
  if (inputs.length === 0 && tables.length === 0) {
    inputs.push(
      { label: 'Taxpayer Category (0% Initial Threshold)', value: 'General Individual Taxpayers — First Tk. 4,00,000' },
      { label: 'Residential Jurisdiction (Minimum Tax)', value: 'Dhaka & Chattogram City Corp (Min Tk. 5,000)' },
      { label: 'Annual Gross Salary Income', value: '৳ 12,36,000', note: '1/3 Exempt: ৳ 4,12,000' },
      { label: 'Net Taxable Income', value: '৳ 8,24,000' },
      { label: 'Total Allowable Investment (6th Schedule)', value: '৳ 10,88,000', note: 'Limit B (10%): ৳ 1,08,800' }
    );

    tables.push({
      title: 'Statutory Tax Slab & Rebate Calculation Statement (AY 2026–2027)',
      headers: ['Slab / Statutory Step', 'Rate', 'Taxable Tier (৳)', 'Tax Payable (৳)'],
      rows: [
        { cells: ['1st Slab (Initial Tax-Free Threshold · First Tk. 4,00,000)', '0%', '4,00,000', '0'], tone: 'default' },
        { cells: ['2nd Slab (Next Tk. 3,00,000)', '10%', '3,00,000', '30,000'], tone: 'default' },
        { cells: ['3rd Slab (Next Tk. 4,00,000)', '15%', '1,24,000', '18,600'], tone: 'default' },
        { cells: ['Gross Tax Liability (Progressive Slabs)', '', '', '৳ 48,600'], tone: 'subtotal' },
        { cells: ['Limit A — 3% of Eligible Total Income (3% of ৳ 8,24,000)', '', '', '৳ 24,720'], tone: 'limit' },
        { cells: ['Limit B — 10% of Total Allowable Investment (10% of ৳ 10,88,000)', '', '', '৳ 1,08,800'], tone: 'limit' },
        { cells: ['Limit C — Maximum Statutory Cap', '', '', '৳ 7,50,000'], tone: 'limit' },
        { cells: ['Less: Allowable Tax Rebate (Lower of Limit A, Limit B, or Limit C)', '', '', '- ৳ 24,720'], tone: 'rebate' },
        { cells: ['FINAL ANNUAL NET TAX PAYABLE', '', '', '৳ 23,880'], tone: 'highlight' },
        { cells: ['MONTHLY SALARY TDS WITHHOLDING (Sec 86 · Annual Net Tax ÷ 12)', '', '', '৳ 1,990.00 / mo'], tone: 'tds' },
      ],
    });

    summaryMetrics.push(
      { label: 'Total Taxable Income', value: '৳ 8,24,000', tone: 'blue' },
      { label: 'Gross Tax Liability', value: '৳ 48,600', tone: 'slate' },
      { label: 'Allowable Tax Rebate', value: '- ৳ 24,720', tone: 'emerald' },
      { label: 'Final Annual Net Tax Payable', value: '৳ 23,880', tone: 'amber' }
    );
  }

  return {
    referenceId,
    generatedAt,
    toolId: meta.toolId,
    toolName: meta.toolName,
    toolCategory: meta.toolCategory,
    toolPath: meta.toolPath,
    statutoryBasis,
    summaryMetrics,
    inputs,
    tables,
    legalNotes: getDefaultLegalNotesForTool(meta.toolId, meta.toolCategory),
  };
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generates an inline-styled, table-based HTML email template compatible with Gmail, Outlook,
 * Apple Mail, and the in-app Live Email Preview Modal.
 */
export function buildCalculationEmailTemplate(payload: CalculationEmailPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `[${payload.referenceId}] ${payload.toolName} — Statutory Calculation Statement (AY 2026–27)`;
  const appBaseUrl = 'https://accounticca.ai.studio';
  const toolFullUrl = `${appBaseUrl}${payload.toolPath.startsWith('/') ? payload.toolPath : `/${payload.toolPath}`}`;

  // Build Summary Metrics HTML
  const metricsHtml =
    payload.summaryMetrics.length > 0
      ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px; border-collapse: separate; border-spacing: 8px 0;">
        <tr>
          ${payload.summaryMetrics
            .slice(0, 4)
            .map((m) => {
              const bg =
                m.tone === 'amber'
                  ? '#FEF3C7'
                  : m.tone === 'emerald'
                  ? '#D1FAE5'
                  : m.tone === 'indigo'
                  ? '#E0E7FF'
                  : m.tone === 'blue'
                  ? '#DBEAFE'
                  : '#F1F5F9';
              const border =
                m.tone === 'amber'
                  ? '#F59E0B'
                  : m.tone === 'emerald'
                  ? '#10B981'
                  : m.tone === 'indigo'
                  ? '#6366F1'
                  : m.tone === 'blue'
                  ? '#3B82F6'
                  : '#CBD5E1';
              const textColor =
                m.tone === 'amber'
                  ? '#78350F'
                  : m.tone === 'emerald'
                  ? '#064E3B'
                  : m.tone === 'indigo'
                  ? '#1E1B4B'
                  : m.tone === 'blue'
                  ? '#1E3A8A'
                  : '#0F172A';
              return `
                <td width="${Math.floor(100 / Math.min(payload.summaryMetrics.length, 4))}%" valign="top" style="background-color: ${bg}; border: 1px solid ${border}; border-radius: 10px; padding: 10px 12px;">
                  <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: ${textColor}; margin-bottom: 4px;">
                    ${escapeHtml(m.label)}
                  </div>
                  <div style="font-size: 15px; font-weight: 900; font-family: 'Courier New', Courier, monospace; color: ${textColor};">
                    ${escapeHtml(m.value)}
                  </div>
                  ${
                    m.sublabel
                      ? `<div style="font-size: 10px; color: ${textColor}; margin-top: 2px;">${escapeHtml(m.sublabel)}</div>`
                      : ''
                  }
                </td>
              `;
            })
            .join('')}
        </tr>
      </table>`
      : '';

  // Build Inputs Section HTML
  const inputsRowsHtml = payload.inputs
    .map(
      (item, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
        <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; border-right: 1px solid #E2E8F0; font-size: 12px; font-weight: 700; color: #0F172A;">
          ${escapeHtml(item.label)}
          ${
            item.note
              ? `<span style="display: inline-block; margin-left: 6px; padding: 1px 6px; font-size: 10px; font-family: 'Courier New', monospace; font-weight: 700; background-color: #D1FAE5; color: #064E3B; border-radius: 4px;">${escapeHtml(
                  item.note
                )}</span>`
              : ''
          }
        </td>
        <td align="right" style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; font-size: 12px; font-weight: 800; font-family: 'Courier New', Courier, monospace; color: #1E3A8A; white-space: nowrap;">
          ${escapeHtml(item.value)}
        </td>
      </tr>`
    )
    .join('');

  // Build Statutory Breakdown Tables HTML
  const tablesHtml = payload.tables
    .map((tbl) => {
      const colCount = tbl.headers.length;
      const headerCells = tbl.headers
        .map(
          (h, hIdx) => `
          <th align="${hIdx === 0 ? 'left' : hIdx === 1 && colCount === 4 ? 'center' : 'right'}" style="padding: 9px 10px; background-color: #E2E8F0; border-bottom: 2px solid #CBD5E1; ${
            hIdx < colCount - 1 ? 'border-right: 1px solid #CBD5E1;' : ''
          } font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.04em; color: #020617;">
            ${escapeHtml(h)}
          </th>`
        )
        .join('');

      const bodyRows = tbl.rows
        .map((row, rIdx) => {
          const tone = row.tone || 'default';
          let rowBg = rIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
          let textColor = '#0F172A';
          let fontWeight = '700';
          let borderTop = '1px solid #E2E8F0';

          if (tone === 'highlight') {
            rowBg = '#FEF3C7';
            textColor = '#78350F';
            fontWeight = '900';
            borderTop = '2px solid #F59E0B';
          } else if (tone === 'tds') {
            rowBg = '#E0E7FF';
            textColor = '#1E1B4B';
            fontWeight = '900';
            borderTop = '2px solid #818CF8';
          } else if (tone === 'rebate') {
            rowBg = '#D1FAE5';
            textColor = '#064E3B';
            fontWeight = '800';
          } else if (tone === 'limit') {
            rowBg = '#EFF6FF';
            textColor = '#1E3A8A';
            fontWeight = '700';
          } else if (tone === 'subtotal') {
            rowBg = '#E2E8F0';
            textColor = '#020617';
            fontWeight = '800';
          }

          // Check if middle cells are empty (colspan summary row)
          const nonEmptyIndices = row.cells
            .map((c, idx) => (c.trim() !== '' ? idx : -1))
            .filter((idx) => idx !== -1);

          if (nonEmptyIndices.length === 2 && colCount > 2 && nonEmptyIndices[0] === 0 && nonEmptyIndices[1] === colCount - 1) {
            return `
              <tr style="background-color: ${rowBg};">
                <td colspan="${colCount - 1}" align="right" style="padding: 8px 10px; border-top: ${borderTop}; border-bottom: 1px solid #CBD5E1; border-right: 1px solid #CBD5E1; font-size: 12px; font-weight: ${fontWeight}; color: ${textColor};">
                  ${escapeHtml(row.cells[0])}
                </td>
                <td align="right" style="padding: 8px 10px; border-top: ${borderTop}; border-bottom: 1px solid #CBD5E1; font-size: ${
              tone === 'highlight' ? '14px' : '12px'
            }; font-weight: 900; font-family: 'Courier New', Courier, monospace; color: ${textColor}; white-space: nowrap;">
                  ${escapeHtml(row.cells[colCount - 1])}
                </td>
              </tr>`;
          }

          return `
            <tr style="background-color: ${rowBg};">
              ${row.cells
                .slice(0, colCount)
                .map((cell, cIdx) => {
                  const align = cIdx === 0 ? 'left' : cIdx === 1 && colCount === 4 ? 'center' : 'right';
                  const isNumericCol = cIdx > 0;
                  return `
                    <td align="${align}" style="padding: 8px 10px; border-top: ${borderTop}; border-bottom: 1px solid #E2E8F0; ${
                    cIdx < colCount - 1 ? 'border-right: 1px solid #E2E8F0;' : ''
                  } font-size: 12px; font-weight: ${fontWeight}; ${
                    isNumericCol ? "font-family: 'Courier New', Courier, monospace;" : ''
                  } color: ${textColor};">
                      ${escapeHtml(cell)}
                    </td>`;
                })
                .join('')}
            </tr>`;
        })
        .join('');

      return `
        <div style="margin-bottom: 22px;">
          <div style="background-color: #0F172A; color: #FFFFFF; padding: 10px 14px; border-radius: 10px 10px 0 0; font-size: 13px; font-weight: 800;">
            2. ${escapeHtml(tbl.title)}
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #CBD5E1; border-top: none; border-collapse: collapse;">
            <thead>
              <tr>${headerCells}</tr>
            </thead>
            <tbody>
              ${bodyRows}
            </tbody>
          </table>
        </div>`;
    })
    .join('');

  // Build Legal Notes HTML
  const legalNotesHtml = payload.legalNotes
    .map(
      (note) => `
      <li style="margin-bottom: 6px; font-size: 11px; line-height: 1.5; color: #1E293B; font-weight: 600;">
        ${escapeHtml(note)}
      </li>`
    )
    .join('');

  const customNoteHtml = payload.customNote?.trim()
    ? `
      <div style="margin-bottom: 18px; padding: 12px 14px; background-color: #EFF6FF; border-left: 4px solid #1D4ED8; border-radius: 6px; font-size: 12px; color: #1E3A8A;">
        <div style="font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; margin-bottom: 4px;">
          Client / Reference Advisory Note
        </div>
        <div style="font-weight: 600; line-height: 1.45;">
          ${escapeHtml(payload.customNote.trim())}
        </div>
      </div>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F1F5F9; padding: 20px 10px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 640px; background-color: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 16px; overflow: hidden;">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0F172A; padding: 22px 24px; color: #FFFFFF;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="display: inline-block; padding: 3px 10px; background-color: #1E3A8A; color: #93C5FD; border: 1px solid #3B82F6; border-radius: 999px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">
                      Accounticca × E-Lawyers BD · Statutory Calculation Report
                    </span>
                    <h1 style="margin: 10px 0 4px 0; font-size: 20px; font-weight: 900; color: #FFFFFF; line-height: 1.25;">
                      ${escapeHtml(payload.toolName)}
                    </h1>
                    <div style="font-size: 11px; color: #CBD5E1; font-weight: 600;">
                      ${escapeHtml(payload.statutoryBasis)}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Metadata Bar -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #334155; font-size: 11px; color: #E2E8F0;">
                <tr>
                  <td>
                    <strong>Reference ID:</strong> <span style="font-family: 'Courier New', monospace; color: #38BDF8; font-weight: 800;">${escapeHtml(payload.referenceId)}</span>
                  </td>
                  <td align="right">
                    <strong>Generated:</strong> ${escapeHtml(payload.generatedAt)}
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 4px;">
                    <strong>Prepared For:</strong> ${escapeHtml(payload.primaryRecipient)}
                  </td>
                  <td align="right" style="padding-top: 4px;">
                    ${
                      payload.ccRecipients.length > 0
                        ? `<strong>CC:</strong> ${escapeHtml(payload.ccRecipients.join(', '))}`
                        : `<strong>Category:</strong> ${escapeHtml(payload.toolCategory)}`
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 22px 24px;">
              ${customNoteHtml}
              ${metricsHtml}

              <!-- Section 1: Input Parameters -->
              ${
                payload.inputs.length > 0
                  ? `
              <div style="margin-bottom: 22px;">
                <div style="background-color: #1E3A8A; color: #FFFFFF; padding: 9px 14px; border-radius: 10px 10px 0 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;">
                  1. Input Parameters &amp; Selected Assumptions
                </div>
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #CBD5E1; border-top: none; border-collapse: collapse;">
                  <tbody>
                    ${inputsRowsHtml}
                  </tbody>
                </table>
              </div>`
                  : ''
              }

              <!-- Section 2: Full Statutory Breakdown Table(s) -->
              ${tablesHtml}

              <!-- Section 3: Statutory Legal Notes -->
              <div style="background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px;">
                <div style="font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.04em; color: #0F172A; margin-bottom: 8px;">
                  3. Statutory Legal Notes &amp; Mandatory Conditions
                </div>
                <ul style="margin: 0; padding-left: 18px;">
                  ${legalNotesHtml}
                </ul>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 6px 0 12px 0;">
                    <a href="${escapeHtml(toolFullUrl)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 11px 22px; background-color: #0F172A; color: #FFFFFF; text-decoration: none; font-size: 12px; font-weight: 800; border-radius: 10px;">
                      Re-Open ${escapeHtml(payload.toolName)} on Accounticca
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 14px 24px; text-align: center; font-size: 11px; color: #475569;">
              <div style="font-weight: 800; color: #0F172A; margin-bottom: 3px;">
                Accounticca × E-Lawyers Bangladesh — Tax, VAT, RJSC &amp; Legal Compliance Suite
              </div>
              <div>
                Dispatched via Accounticca Compliance Mail Service · Reference <span style="font-family: monospace; font-weight: 700;">${escapeHtml(payload.referenceId)}</span>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textLines: string[] = [
    `ACCOUNTICCA x E-LAWYERS BD — STATUTORY CALCULATION STATEMENT`,
    `Tool: ${payload.toolName} (${payload.toolCategory})`,
    `Statutory Basis: ${payload.statutoryBasis}`,
    `Reference ID: ${payload.referenceId}`,
    `Generated At: ${payload.generatedAt}`,
    `Primary Recipient: ${payload.primaryRecipient}`,
  ];
  if (payload.ccRecipients.length > 0) {
    textLines.push(`CC Recipients: ${payload.ccRecipients.join(', ')}`);
  }
  if (payload.customNote?.trim()) {
    textLines.push(`\nClient / Reference Note:\n${payload.customNote.trim()}`);
  }
  textLines.push(`\n--- 1. INPUT PARAMETERS ---`);
  payload.inputs.forEach((inp) => {
    textLines.push(`• ${inp.label}: ${inp.value}${inp.note ? ` (${inp.note})` : ''}`);
  });
  textLines.push(`\n--- 2. STATUTORY BREAKDOWN ---`);
  payload.tables.forEach((tbl) => {
    textLines.push(`\n[${tbl.title}]`);
    textLines.push(tbl.headers.join(' | '));
    tbl.rows.forEach((r) => {
      textLines.push(r.cells.filter(Boolean).join(' | '));
    });
  });
  textLines.push(`\n--- 3. STATUTORY LEGAL NOTES ---`);
  payload.legalNotes.forEach((n) => textLines.push(`* ${n}`));
  textLines.push(`\nOpen Tool: ${toolFullUrl}`);

  return {
    subject,
    html,
    text: textLines.join('\n'),
  };
}
