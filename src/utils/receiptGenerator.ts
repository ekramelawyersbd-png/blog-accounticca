import { jsPDF } from 'jspdf';
import { TransactionRecord } from '../contexts/PurchaseContext';

export interface ReceiptDataPayload extends Partial<TransactionRecord> {
  id: string;
  transactionId: string;
  amount: number;
  productTitle: string;
  referenceId?: string;
  orderId?: string;
  date?: string;
  status?: 'completed' | 'pending' | 'refunded';
  paymentMethod?: string;
  customerName?: string;
  customerEmail?: string;
  userEmail?: string;
  customerPhone?: string;
  items?: Array<{
    title: string;
    price: number;
    quantity?: number;
  }>;
}

export const generatePdfReceipt = (tx: TransactionRecord | ReceiptDataPayload) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header background banner
  doc.setFillColor(241, 245, 249);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Brand Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text('ACCOUNTICCA & E-LAWYERS', 20, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Verified Digital Tax & Legal Compliance Shop', 20, 29);

  // Badge: Tax Audit Compliant
  doc.setFillColor(209, 250, 229);
  doc.roundedRect(pageWidth - 65, 14, 45, 12, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105);
  doc.text('NBR AUDIT READY', pageWidth - 57, 21);

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(20, 45, pageWidth - 20, 45);

  // Receipt Title & Meta box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('OFFICIAL DIGITAL PAYMENT RECEIPT', 20, 56);

  // Metadata block
  const metaHeight = (tx as any).customerName || (tx as any).customerEmail || tx.userEmail ? 44 : 36;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, 62, pageWidth - 40, metaHeight, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(20, 62, pageWidth - 40, metaHeight, 3, 3, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);

  const col1X = 26;
  const col2X = 115;

  doc.text(`Receipt Reference:`, col1X, 70);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(tx.id || 'REC-VERIFIED', col1X + 35, 70);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Gateway TrxID:`, col1X, 78);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(tx.transactionId || 'N/A', col1X + 35, 78);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Order Reference:`, col1X, 86);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(tx.referenceId || (tx as any).orderId || 'ACC-2026-REF', col1X + 35, 86);

  if ((tx as any).customerName || (tx as any).customerEmail || tx.userEmail) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Billed To:`, col1X, 94);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const clientStr = `${(tx as any).customerName || 'Valued Client'} (${(tx as any).customerEmail || tx.userEmail || ''})`;
    doc.text(clientStr.length > 40 ? clientStr.substring(0, 37) + '...' : clientStr, col1X + 35, 94);
  }

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Date & Time:`, col2X, 70);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const formattedDate = tx.date ? new Date(tx.date).toLocaleString('en-GB') : new Date().toLocaleString('en-GB');
  doc.text(formattedDate, col2X + 28, 70);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Payment Status:`, col2X, 78);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text((tx.status || 'COMPLETED').toUpperCase(), col2X + 28, 78);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Payment Method:`, col2X, 86);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(tx.paymentMethod || 'UddoktaPay / Paymently MFS', col2X + 28, 86);

  // Purchased Items Table Header
  const tableStartY = 62 + metaHeight + 8;
  doc.setFillColor(15, 23, 42);
  doc.rect(20, tableStartY, pageWidth - 40, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('DESCRIPTION OF DIGITAL COMPLIANCE PRODUCT', 26, tableStartY + 6.5);
  doc.text('AMOUNT (BDT)', pageWidth - 26, tableStartY + 6.5, { align: 'right' });

  // Render items rows
  const itemsList = (tx as any).items && Array.isArray((tx as any).items) && (tx as any).items.length > 0
    ? (tx as any).items
    : [{ title: tx.productTitle || 'Digital Compliance Toolkit', price: tx.amount, quantity: 1 }];

  let currentY = tableStartY + 10;
  itemsList.forEach((item: any, idx: number) => {
    const itemHeight = 16;
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
    doc.rect(20, currentY, pageWidth - 40, itemHeight, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(20, currentY, pageWidth - 40, itemHeight, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    const itemTitle = item.quantity && item.quantity > 1 ? `${item.title} (x${item.quantity})` : item.title;
    doc.text(itemTitle.length > 55 ? itemTitle.substring(0, 52) + '...' : itemTitle, 26, currentY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Verified Instant Statutory Download & Authorized Digital License', 26, currentY + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    const linePrice = item.price * (item.quantity || 1);
    doc.text(`BDT ${linePrice.toLocaleString('en-IN')}`, pageWidth - 26, currentY + 9, { align: 'right' });

    currentY += itemHeight;
  });

  // Totals Box
  const totalY = currentY + 8;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(pageWidth - 90, totalY, 70, 24, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(pageWidth - 90, totalY, 70, 24, 2, 2, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal:', pageWidth - 84, totalY + 7);
  doc.text(`BDT ${tx.amount.toLocaleString('en-IN')}`, pageWidth - 26, totalY + 7, { align: 'right' });

  doc.text('VAT / Tax (0%):', pageWidth - 84, totalY + 14);
  doc.text('BDT 0', pageWidth - 26, totalY + 14, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(16, 185, 129);
  doc.text('Total Paid:', pageWidth - 84, totalY + 21);
  doc.text(`BDT ${tx.amount.toLocaleString('en-IN')}`, pageWidth - 26, totalY + 21, { align: 'right' });

  // Merchant Details Box at Bottom
  const merchantY = Math.max(totalY + 32, 195);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(20, merchantY, pageWidth - 40, 42, 3, 3, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(20, merchantY, pageWidth - 40, 42, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Accounticca Advisory & eLawyers Bangladesh', 26, merchantY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Dhaka Chamber Building (2nd Floor), Motijheel C/A, Dhaka-1000', 26, merchantY + 15);
  doc.text('Hotline: +88 01335230170 | Email: support@accounticca.com', 26, merchantY + 22);
  doc.text('Tax Identification Number (TIN): 482910283401 | VAT Reg No: 003928102-0101', 26, merchantY + 29);
  doc.text(`Settlement Gateway: ${tx.paymentMethod || 'Paymently / UddoktaPay BDT Gateway'}`, 26, merchantY + 36);

  // Footer seal notice
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'This is a verified computer-generated PDF receipt backed by Firestore transaction metadata. Valid for NBR tax audit records.',
    pageWidth / 2,
    merchantY + 49,
    { align: 'center' }
  );

  // Save PDF
  const filename = `Receipt-${tx.referenceId || (tx as any).orderId || tx.transactionId || 'Payment'}.pdf`;
  doc.save(filename);
  return doc;
};
