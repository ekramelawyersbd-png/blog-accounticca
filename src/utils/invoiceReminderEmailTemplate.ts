export interface InvoiceReminderPayload {
  invoiceNumber: string;
  docketNumber: string;
  clientName: string;
  clientCompany?: string;
  clientEmail: string;
  serviceTitle: string;
  amount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  daysRemaining: number;
  urgencyLabel: string;
  bKashNumber: string;
  customNote?: string;
  portalUrl?: string;
}

export function generateInvoiceReminderEmailHtml(data: InvoiceReminderPayload): { subject: string; html: string; text: string } {
  const isUrgent = data.daysRemaining <= 1;
  const isApproaching = data.daysRemaining > 1 && data.daysRemaining <= 3;
  
  const statusColor = isUrgent ? '#dc2626' : isApproaching ? '#d97706' : '#059669';
  const statusBg = isUrgent ? '#fef2f2' : isApproaching ? '#fffbeb' : '#ecfdf5';
  const statusBorder = isUrgent ? '#fecaca' : isApproaching ? '#fde68a' : '#a7f3d0';

  const subject = `[ACTION REQUIRED] Invoice Due Reminder #${data.invoiceNumber} (${data.urgencyLabel}) - BDT ${data.amount.toLocaleString()} - ELA & Associates`;

  const text = `
ELA & ASSOCIATES | ADVOCATES & TAX CONSULTANTS
Official Invoice Payment Due Notice

Attention: ${data.clientName} ${data.clientCompany ? `(${data.clientCompany})` : ''}
Invoice Number: ${data.invoiceNumber}
Matter Docket: ${data.docketNumber}
Service Rendered: ${data.serviceTitle}
Outstanding Amount: BDT ${data.amount.toLocaleString()}
Payment Due Date: ${data.dueDate} (${data.urgencyLabel})

--------------------------------------------------------------------------------
PAYMENT INSTRUCTIONS (bKash Personal):
To complete your payment via bKash Personal, please send the exact payment amount specified below to the provided bKash number.

bKash Personal Number: ${data.bKashNumber}
Payment Amount: BDT ${data.amount.toLocaleString()}

Please select the Send Money option and complete the transaction. After payment, enter your Transaction ID (TrxID) in the Client Portal or reply to this notice with your TrxID to confirm clearance.

Transaction ID (TrxID): [Enter Your Transaction ID]
--------------------------------------------------------------------------------

${data.customNote ? `Special Advisory Note:\n${data.customNote}\n\n` : ''}
Portal Access: ${data.portalUrl || 'https://accounticca.com/portal?tab=payments'}

Chambers Address: Suite 704, Concord Tower, 113 Kazi Nazrul Islam Avenue, Dhaka-1000
Hotline: +880 1744-883636 | Email: accounts@accounticca.com
`.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="640" cellpadding="0" cellspacing="0" border="0" style="max-width: 640px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 36px; border-bottom: 3px solid #059669;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <div style="color: #10b981; font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 6px;">
                      ELA & ASSOCIATES LEGAL CHAMBERS · FINANCIAL DOCKET
                    </div>
                    <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; line-height: 1.3;">
                      Invoice Payment Reminder
                    </h1>
                    <p style="color: #94a3b8; font-size: 13px; margin: 6px 0 0 0;">
                      Formal notification for pending corporate & professional fees
                    </p>
                  </td>
                  <td align="right" valign="top">
                    <div style="background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 8px; padding: 6px 12px; color: #34d399; font-size: 11px; font-weight: 700; text-align: center;">
                      ${data.invoiceNumber}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Urgency Alert Bar -->
          <tr>
            <td style="padding: 20px 36px 0 36px;">
              <div style="background-color: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 10px; padding: 14px 18px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="28" valign="middle">
                      <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: ${statusColor};"></span>
                    </td>
                    <td valign="middle">
                      <strong style="color: ${statusColor}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">
                        Status: ${data.urgencyLabel}
                      </strong>
                      <div style="color: #475569; font-size: 12px; margin-top: 2px;">
                        This invoice is scheduled for settlement by <strong>${data.dueDate}</strong> (${data.daysRemaining <= 0 ? 'Due Today' : `${data.daysRemaining} day${data.daysRemaining > 1 ? 's' : ''} remaining`}).
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 24px 36px;">
              <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 18px 0;">
                Dear <strong>${data.clientName}</strong>${data.clientCompany ? ` (${data.clientCompany})` : ''},
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
                This is a friendly reminder that an invoice for legal, tax advisory, or statutory filing services rendered by ELA & Associates is currently pending payment. To ensure uninterrupted service and statutory docket compliance, please settle the outstanding balance before the due date.
              </p>

              <!-- Invoice Breakdown Card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.05em;">Service / Engagement</div>
                    <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 4px;">${data.serviceTitle}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Docket Reference: <strong>${data.docketNumber}</strong></div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="33%">
                          <div style="font-size: 11px; color: #64748b; font-weight: 600;">Issue Date</div>
                          <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-top: 2px;">${data.issueDate}</div>
                        </td>
                        <td width="33%">
                          <div style="font-size: 11px; color: #64748b; font-weight: 600;">Due Date</div>
                          <div style="font-size: 13px; font-weight: 700; color: ${statusColor}; margin-top: 2px;">${data.dueDate}</div>
                        </td>
                        <td width="34%" align="right">
                          <div style="font-size: 11px; color: #64748b; font-weight: 600;">Total Payable</div>
                          <div style="font-size: 18px; font-weight: 800; color: #059669; margin-top: 2px;">BDT ${data.amount.toLocaleString()}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Payment Instructions Box (bKash Personal) -->
              <div style="background-color: #fdf2f8; border: 2px dashed #f472b6; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding-bottom: 10px;">
                      <span style="background-color: #e2136e; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.05em; display: inline-block;">
                        PAYMENT INSTRUCTIONS · bKash PERSONAL
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 13px; line-height: 1.6; color: #831843;">
                      To complete your payment via <strong>bKash Personal</strong>, please send the exact payment amount specified below to the provided bKash number:
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 1px solid #fbcfe8; border-radius: 8px; padding: 12px 16px;">
                        <tr>
                          <td>
                            <div style="font-size: 11px; color: #9d174d; font-weight: 600;">bKash Personal Number:</div>
                            <div style="font-size: 18px; font-weight: 800; color: #e2136e; font-family: monospace; letter-spacing: 0.05em;">
                              ${data.bKashNumber}
                            </div>
                          </td>
                          <td align="right">
                            <div style="font-size: 11px; color: #9d174d; font-weight: 600;">Payment Amount:</div>
                            <div style="font-size: 18px; font-weight: 800; color: #0f172a;">
                              BDT ${data.amount.toLocaleString()}
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 12px; line-height: 1.5; color: #9d174d;">
                      <strong>Step-by-step:</strong> Please select the <em>Send Money</em> option and complete the transaction. After payment, enter your Transaction ID (TrxID) in the field within the Client Portal or reply to this email with your TrxID to confirm your payment.
                    </td>
                  </tr>
                </table>
              </div>

              ${data.customNote ? `
              <!-- Custom Advisory Note -->
              <div style="background-color: #f1f5f9; border-left: 4px solid #64748b; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px; font-size: 13px; color: #334155;">
                <strong style="color: #0f172a;">Counsel's Note:</strong> ${data.customNote}
              </div>
              ` : ''}

              <!-- Action Button -->
              <div style="text-align: center; margin: 30px 0 20px 0;">
                <a href="${data.portalUrl || 'https://accounticca.com/portal?tab=payments'}" style="background-color: #059669; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 28px; border-radius: 10px; display: inline-block; letter-spacing: 0.02em; box-shadow: 0 4px 8px rgba(5, 150, 105, 0.25);">
                  View Invoice & Submit TrxID in Portal →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px 36px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.5;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <strong style="color: #334155;">ELA & Associates Advocates & Tax Consultants</strong><br>
                    Suite 704, Concord Tower, 113 Kazi Nazrul Islam Avenue, Dhaka-1000<br>
                    Hotline: +880 1744-883636 | Email: accounts@accounticca.com
                  </td>
                  <td align="right" valign="top" style="font-size: 11px;">
                    Automated Billing Engine<br>
                    Ref: ${data.docketNumber}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject, html, text };
}
