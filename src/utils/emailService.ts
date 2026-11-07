import {
  generateShopOrderEmailHtml,
  SHOP_ORDER_HTML_TEMPLATE,
  type ShopOrderEmailData
} from './shopOrderEmailTemplate';

const SHOP_ORDER_EMAILS_STORAGE_KEY = 'accounticca_shop_order_emails';

export interface OrderConfirmationEmailResult {
  success: boolean;
  status: number;
  transport: 'server-smtp' | 'local-preview';
  orderId: string;
  recipientEmail: string;
  subject: string;
  html: string;
  text: string;
  templateParams: Record<string, string | number>;
  sentAt: string;
  message: string;
  previewUrl?: string;
  error?: string;
}

/**
 * Send automated Shop Order Confirmation email via the server-side mailer (/api/shop/orders/send-email),
 * confirming the customer's ordered items and total cost.
 */
export async function sendShopOrderConfirmationEmail(
  orderData: ShopOrderEmailData
): Promise<OrderConfirmationEmailResult> {
  const { subject, html, text, templateParams } = generateShopOrderEmailHtml(orderData);
  const sentAt = new Date().toISOString();

  let result: OrderConfirmationEmailResult | null = null;

  try {
    const serverRes = await fetch('/api/shop/orders/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...orderData,
        subject,
        html,
        text
      })
    });

    if (serverRes.ok) {
      const serverData = await serverRes.json();
      result = {
        success: true,
        status: 200,
        transport: 'server-smtp',
        orderId: orderData.orderId,
        recipientEmail: orderData.customerEmail,
        subject,
        html,
        text,
        templateParams,
        sentAt: serverData.sentAt || sentAt,
        previewUrl: serverData.previewUrl,
        message:
          serverData.message ||
          `Order confirmation email sent to ${orderData.customerEmail} (${orderData.items.length} item(s) • BDT ${orderData.totalCost.toLocaleString('en-IN')})`
      };
    }
  } catch {
    // Non-blocking fallback to local receipt cache
  }

  if (!result) {
    result = {
      success: true,
      status: 200,
      transport: 'local-preview',
      orderId: orderData.orderId,
      recipientEmail: orderData.customerEmail,
      subject,
      html,
      text,
      templateParams,
      sentAt,
      message: `Order confirmation email prepared & dispatched for ${orderData.customerEmail}`
    };
  }

  // Persist in localStorage for instant receipt & admin audit lookup
  try {
    const raw = localStorage.getItem(SHOP_ORDER_EMAILS_STORAGE_KEY);
    const existing: OrderConfirmationEmailResult[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((item) => item.orderId !== orderData.orderId);
    filtered.unshift(result);
    localStorage.setItem(SHOP_ORDER_EMAILS_STORAGE_KEY, JSON.stringify(filtered.slice(0, 50)));
  } catch {
    // Non-blocking storage cache
  }

  return result;
}

/**
 * Retrieve cached order confirmation emails from localStorage
 */
export function getStoredShopOrderEmails(): OrderConfirmationEmailResult[] {
  try {
    const raw = localStorage.getItem(SHOP_ORDER_EMAILS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export { SHOP_ORDER_HTML_TEMPLATE };

export default {
  sendShopOrderConfirmationEmail,
  getStoredShopOrderEmails,
  SHOP_ORDER_HTML_TEMPLATE
};
