export interface ShopOrderItemPayload {
  productId: string;
  slug?: string;
  title: string;
  category: string;
  productType?: string;
  format: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ShopOrderEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName?: string;
  items: ShopOrderItemPayload[];
  subtotal: number;
  discount: number;
  totalCost: number;
  paymentMethod: string;
  trxId: string;
  orderDate?: string;
  authProvider?: string;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatBdt(amount: number): string {
  return `BDT ${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Raw Order Confirmation HTML Template with Mustache placeholders ({{variable}})
 */
export const SHOP_ORDER_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmation #{{order_id}} - Accounticca &amp; E-Lawyers</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 660px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);">
          
          <!-- Top Executive Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 65%, #065f46 100%); padding: 32px 36px; border-bottom: 4px solid #10b981;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: #34d399; margin-bottom: 6px;">
                      Accounticca &amp; E-Lawyers Digital Compliance Shop
                    </div>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                      Order Confirmed &amp; Assets Unlocked
                    </h1>
                    <p style="margin: 6px 0 0; font-size: 13px; color: #cbd5e1;">
                      Issued on {{order_date}} · Verified Digital Procurement Receipt
                    </p>
                  </td>
                  <td align="right" valign="top">
                    <div style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 10px; padding: 10px 14px; text-align: right;">
                      <span style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8;">Order Ref</span>
                      <strong style="font-size: 14px; font-family: monospace; color: #34d399;">{{order_id}}</strong>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting & Summary Callout -->
          <tr>
            <td style="padding: 32px 36px 16px;">
              <p style="margin: 0 0 12px; font-size: 15px; color: #0f172a; line-height: 1.6;">
                Dear <strong>{{to_name}}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 14px; color: #475569; line-height: 1.6;">
                Thank you for your order with the <strong>Accounticca &amp; E-Lawyers Compliance Shop</strong>. Your payment and order details have been verified. Below is the itemized confirmation of your purchased digital kits and total settlement cost.
              </p>

              <!-- Customer & Payment Metadata Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td width="50%" valign="top" style="padding: 16px 20px; border-right: 1px solid #e2e8f0;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; margin-bottom: 6px;">
                      Licensed Purchaser
                    </div>
                    <div style="font-size: 14px; font-weight: 700; color: #0f172a;">{{to_name}}</div>
                    <div style="font-size: 12.5px; color: #475569; margin-top: 2px;">{{to_email}}</div>
                    <div style="font-size: 12.5px; color: #475569; margin-top: 2px;">Phone: {{customer_phone}}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Entity: {{company_name}}</div>
                  </td>
                  <td width="50%" valign="top" style="padding: 16px 20px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; margin-bottom: 6px;">
                      Settlement &amp; Verification
                    </div>
                    <div style="font-size: 13px; color: #0f172a; line-height: 1.6;">
                      <strong>Method:</strong> {{payment_method}}<br />
                      <strong>TrxID / Ref:</strong> <span style="font-family: monospace; font-weight: 700; color: #047857;">{{trx_id}}</span><br />
                      <strong>Items Count:</strong> {{items_count}}<br />
                      <strong>Total Paid:</strong> <strong style="color: #047857;">{{total_cost_bdt}}</strong>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Itemized Order Table -->
              <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #0f172a; margin-bottom: 10px;">
                Ordered Items &amp; License Breakdown
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 20px;">
                <thead>
                  <tr style="background-color: #0f172a; color: #ffffff; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">
                    <th align="left" style="padding: 12px 14px;">Item &amp; Format</th>
                    <th align="center" style="padding: 12px 10px;">Qty</th>
                    <th align="right" style="padding: 12px 14px;">Unit Price</th>
                    <th align="right" style="padding: 12px 14px;">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {{{items_rows_html}}}
                </tbody>
              </table>

              <!-- Cost Summary Table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
                <tr>
                  <td style="font-size: 13px; color: #334155; padding: 4px 0;">Subtotal Amount:</td>
                  <td align="right" style="font-size: 13px; font-weight: 700; color: #0f172a; padding: 4px 0; font-variant-numeric: tabular-nums;">{{subtotal_bdt}}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #047857; padding: 4px 0;">Discount / Promo Savings:</td>
                  <td align="right" style="font-size: 13px; font-weight: 700; color: #047857; padding: 4px 0; font-variant-numeric: tabular-nums;">-{{discount_bdt}}</td>
                </tr>
                <tr>
                  <td style="font-size: 15px; font-weight: 800; color: #064e3b; padding: 10px 0 2px; border-top: 1px solid #a7f3d0;">Total Cost Confirmed:</td>
                  <td align="right" style="font-size: 18px; font-weight: 900; color: #047857; padding: 10px 0 2px; border-top: 1px solid #a7f3d0; font-variant-numeric: tabular-nums;">{{total_cost_bdt}}</td>
                </tr>
              </table>

              <!-- Instant Portal CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <a href="{{portal_url}}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 800; padding: 13px 28px; border-radius: 10px;">
                      Access Purchased Downloads &amp; Student Portal
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12.5px; color: #64748b; line-height: 1.6; text-align: center;">
                Questions regarding your digital templates or statutory toolkits? Reply directly to this email or contact <a href="mailto:{{support_email}}" style="color: #059669; text-decoration: none; font-weight: 600;">{{support_email}}</a> ({{support_phone}}).
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 36px; text-align: center; font-size: 11.5px; color: #64748b; line-height: 1.6;">
              <strong>ACCOUNTICCA ADVISORY &amp; E-LAWYERS BANGLADESH</strong><br />
              Suite G-5, BTI Centara Grand, 144 Green Road, Panthapath, Dhaka-1205<br />
              Official Digital Procurement Confirmation · Valid for Corporate &amp; NBR Tax Audit Records
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

/**
 * Generates the rendered HTML, plain-text summary, itemized HTML rows, and complete
 * template parameter map for a customer's Shop order.
 */
export function generateShopOrderEmailHtml(order: ShopOrderEmailData): {
  subject: string;
  html: string;
  text: string;
  itemsRowsHtml: string;
  itemsSummaryText: string;
  templateParams: Record<string, string | number>;
} {
  const orderDate =
    order.orderDate ||
    new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const companyName = order.companyName?.trim() || 'Direct Individual Client';
  const totalQuantity = order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subject = `Order Confirmation #${order.orderId} — ${formatBdt(order.totalCost)} | Accounticca & E-Lawyers Shop`;

  const itemsRowsHtml = order.items
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 12px 14px; font-size: 13px; color: #0f172a;">
          <div style="font-weight: 700; color: #0f172a;">${escapeHtml(item.title)}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
            ${escapeHtml(item.category)} · Format: ${escapeHtml(item.format)}
          </div>
        </td>
        <td align="center" style="padding: 12px 10px; font-size: 13px; font-weight: 600; color: #334155; font-variant-numeric: tabular-nums;">
          ${item.quantity}
        </td>
        <td align="right" style="padding: 12px 14px; font-size: 13px; color: #475569; font-variant-numeric: tabular-nums;">
          ${formatBdt(item.unitPrice)}
        </td>
        <td align="right" style="padding: 12px 14px; font-size: 13px; font-weight: 700; color: #0f172a; font-variant-numeric: tabular-nums;">
          ${formatBdt(item.lineTotal)}
        </td>
      </tr>`
    )
    .join('');

  const itemsSummaryText = order.items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.title} (${item.format}) — Qty: ${item.quantity} × ${formatBdt(item.unitPrice)} = ${formatBdt(item.lineTotal)}`
    )
    .join('\n');

  const portalUrl =
    typeof window !== 'undefined' && window.location?.origin
      ? `${window.location.origin}/profile`
      : 'https://blog.accounticca.com/profile';

  const supportEmail = 'support@accounticca.com';
  const supportPhone = '+880 1335-230170';

  const text = `
ACCOUNTICCA & E-LAWYERS DIGITAL COMPLIANCE SHOP
OFFICIAL ORDER CONFIRMATION
====================================================
Order Reference: ${order.orderId}
Order Date: ${orderDate}

CUSTOMER DETAILS:
- Name: ${order.customerName}
- Email: ${order.customerEmail}
- Phone: ${order.customerPhone}
- Organization: ${companyName}

ORDERED ITEMS (${totalQuantity} item${totalQuantity === 1 ? '' : 's'}):
${itemsSummaryText}

COST SUMMARY:
- Subtotal: ${formatBdt(order.subtotal)}
- Discount: -${formatBdt(order.discount)}
- Total Cost Confirmed: ${formatBdt(order.totalCost)}

PAYMENT & SETTLEMENT:
- Payment Method: ${order.paymentMethod}
- Transaction ID (TrxID): ${order.trxId}

Access your purchased downloads anytime at: ${portalUrl}
Support: ${supportEmail} | Hotline: ${supportPhone}
====================================================
`.trim();

  const html = SHOP_ORDER_HTML_TEMPLATE.replace(/\{\{order_id\}\}/g, escapeHtml(order.orderId))
    .replace(/\{\{order_date\}\}/g, escapeHtml(orderDate))
    .replace(/\{\{to_name\}\}/g, escapeHtml(order.customerName))
    .replace(/\{\{to_email\}\}/g, escapeHtml(order.customerEmail))
    .replace(/\{\{customer_phone\}\}/g, escapeHtml(order.customerPhone))
    .replace(/\{\{company_name\}\}/g, escapeHtml(companyName))
    .replace(/\{\{payment_method\}\}/g, escapeHtml(order.paymentMethod))
    .replace(/\{\{trx_id\}\}/g, escapeHtml(order.trxId))
    .replace(/\{\{items_count\}\}/g, `${totalQuantity} item${totalQuantity === 1 ? '' : 's'}`)
    .replace(/\{\{\{items_rows_html\}\}\}/g, itemsRowsHtml)
    .replace(/\{\{subtotal_bdt\}\}/g, formatBdt(order.subtotal))
    .replace(/\{\{discount_bdt\}\}/g, formatBdt(order.discount))
    .replace(/\{\{total_cost_bdt\}\}/g, formatBdt(order.totalCost))
    .replace(/\{\{portal_url\}\}/g, portalUrl)
    .replace(/\{\{support_email\}\}/g, supportEmail)
    .replace(/\{\{support_phone\}\}/g, supportPhone);

  const templateParams: Record<string, string | number> = {
    // Standard recipient & sender variables
    to_name: order.customerName,
    to_email: order.customerEmail,
    customer_name: order.customerName,
    customer_email: order.customerEmail,
    customer_phone: order.customerPhone,
    company_name: companyName,
    reply_to: supportEmail,

    // Order identification & metadata
    order_id: order.orderId,
    reference_id: order.orderId,
    order_date: orderDate,
    payment_method: order.paymentMethod,
    trx_id: order.trxId,

    // Itemized list & counts
    items_count: `${totalQuantity} item${totalQuantity === 1 ? '' : 's'}`,
    items_summary_text: itemsSummaryText,
    items_rows_html: itemsRowsHtml,

    // Cost breakdown
    subtotal_bdt: formatBdt(order.subtotal),
    discount_bdt: formatBdt(order.discount),
    total_cost_bdt: formatBdt(order.totalCost),
    total_amount: order.totalCost,

    // Portal & support links
    portal_url: portalUrl,
    support_email: supportEmail,
    support_phone: supportPhone,

    // Full subject, plain text message, and rendered HTML body
    subject,
    message: text,
    order_confirmation_html: html
  };

  return {
    subject,
    html,
    text,
    itemsRowsHtml,
    itemsSummaryText,
    templateParams
  };
}
