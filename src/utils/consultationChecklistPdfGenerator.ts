import { jsPDF } from 'jspdf';
import { AppointmentRecord } from '../components/AppointmentBookingForm';

/**
 * Generates and downloads an executive PDF consultation checklist & preparation guide
 * for a successfully booked appointment.
 */
export function generateConsultationChecklistPDF(booking: AppointmentRecord, practiceChecklist: string[]): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  // Header Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 6, 'F');

  // Top Chambers Header
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('ACCOUNTICCA ADVISORY × E-LAWYERS CHAMBERS • EXECUTIVE CONSULTATION', margin, 14);
  doc.text('OFFICIAL PREPARATION BRIEF', pageWidth - margin, 14, { align: 'right' });

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, 17, pageWidth - margin, 17);

  y = 26;

  // Reference Badge
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.rect(margin, y, 65, 6, 'F');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.setFont('helvetica', 'bold');
  doc.text(`REFERENCE: ${booking.referenceId}`, margin + 3, y + 4.2);

  y += 12;

  // Title
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('Consultation Document & Preparation Checklist', margin, y);
  y += 7;

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tailored for: ${booking.practiceArea} (${booking.expertiseArea})`, margin, y);
  y += 10;

  // Summary Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('CLIENT NAME', margin + 4, y + 6);
  doc.text('CONSULTATION MODE', margin + 70, y + 6);
  doc.text('SCHEDULED TIME', margin + 125, y + 6);

  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(booking.clientName, margin + 4, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(booking.companyName, margin + 4, y + 17);

  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(booking.mode === 'virtual' ? 'Virtual (Google Meet)' : 'In-Person Chamber', margin + 70, y + 12);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(booking.mode === 'virtual' ? 'Secure Video Link' : 'Suite G-5, Panthapath, Dhaka', margin + 70, y + 17);

  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(booking.date, margin + 125, y + 12);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(5, 150, 105);
  doc.text(booking.timeSlot, margin + 125, y + 17);

  y += 40;

  // Checklist Items Header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Mandatory & Recommended Preparation Items', margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Please have the following records available for review during your 45-minute advisory session:', margin, y);
  y += 10;

  // Checklist Boxes
  practiceChecklist.forEach((item, index) => {
    // Checkbox square
    doc.setDrawColor(5, 150, 105);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y - 3, 5, 5, 1, 1, 'S');

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Item ${index + 1}:`, margin + 8, y + 1);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const itemLines = doc.splitTextToSize(item, contentWidth - 20);
    doc.text(itemLines, margin + 25, y + 1);

    y += itemLines.length * 6 + 6;
  });

  y += 6;

  // General Chamber Advice
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70);
  doc.text('Chamber Confidentiality Notice', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(4, 120, 87);
  const noticeText = 'All shared documents and briefs are protected under advocate-client legal privilege and chartered accountant confidentiality standards. Upload encrypted files directly via your Client Portal.';
  const noticeLines = doc.splitTextToSize(noticeText, contentWidth - 8);
  doc.text(noticeLines, margin + 4, y + 12);

  // Footer
  const footerY = pageHeight - 14;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Accounticca Advisory & E-Lawyers Chambers • Hotline: +880 1335-230170 • www.elawyersbd.com', margin, footerY);

  doc.save(`Consultation-Checklist-${booking.referenceId}.pdf`);
}
