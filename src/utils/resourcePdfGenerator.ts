import { jsPDF } from 'jspdf';
import { ResourceTemplate } from '../data/resourceTemplates';

export function generateTemplatePDF(template: ResourceTemplate) {
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

  const primaryColor = [15, 23, 42]; // slate-900
  const emeraldColor = [5, 150, 105]; // emerald-600
  const slateMuted = [100, 116, 139]; // slate-500
  const lightBg = [241, 245, 249]; // slate-100

  function addHeaderFooter(currentPage: number, totalPages: number) {
    // Top brand line
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 5, 'F');

    // Header text
    doc.setFontSize(8);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text('E-LAWYERSBD LEGAL & TAX RESOURCE LIBRARY', margin, 12);
    doc.text('WWW.ELAWYERSBD.COM', pageWidth - margin, 12, { align: 'right' });
    
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.line(margin, 14, pageWidth - margin, 14);

    // Footer
    const footerY = pageHeight - 12;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

    doc.setFontSize(8);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(
      'Disclaimer: Template for informational & drafting use. Consult legal counsel for specific transactions.',
      margin,
      footerY
    );
    doc.text(`Page ${currentPage} of ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
  }

  // Cover / Header banner on first page
  y = 22;

  // Category Tag
  doc.setFillColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
  doc.roundedRect(margin, y, 40, 6, 1.5, 1.5, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(template.category.toUpperCase(), margin + 20, y + 4.2, { align: 'center' });
  y += 10;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  const titleLines = doc.splitTextToSize(template.title, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 7;

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  const subtitleLines = doc.splitTextToSize(template.subtitle, contentWidth);
  doc.text(subtitleLines, margin, y);
  y += subtitleLines.length * 5 + 4;

  // Meta banner box (Governing Law & Jurisdiction)
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'D');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Governing Law:', margin + 4, y + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(template.governingLaw, margin + 29, y + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Jurisdiction:', margin + 4, y + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('People\'s Republic of Bangladesh | E-LawyersBD Resource Series', margin + 25, y + 10.5);

  y += 20;

  // Content Sections
  template.sections.forEach((section) => {
    // Check if we need a new page
    if (y > pageHeight - 35) {
      doc.addPage();
      y = 22;
    }

    // Section Heading
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
    doc.text(section.heading, margin, y);
    y += 5.5;

    // Section Content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);

    if (Array.isArray(section.content)) {
      section.content.forEach((bullet) => {
        if (y > pageHeight - 25) {
          doc.addPage();
          y = 22;
        }
        const bulletLines = doc.splitTextToSize(`•  ${bullet}`, contentWidth - 4);
        doc.text(bulletLines, margin + 2, y);
        y += bulletLines.length * 4.5 + 1.5;
      });
    } else {
      const textLines = doc.splitTextToSize(section.content, contentWidth);
      if (y + (textLines.length * 4.5) > pageHeight - 25) {
        doc.addPage();
        y = 22;
      }
      doc.text(textLines, margin, y);
      y += textLines.length * 4.5 + 2;
    }

    y += 4;
  });

  // Check if we need space for signature block
  if (y > pageHeight - 65) {
    doc.addPage();
    y = 22;
  } else {
    y += 5;
  }

  // Execution / Signature Section
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('EXECUTION AND SIGNATURE ATTESTATION', margin, y);
  y += 8;

  const colWidth = (contentWidth - 10) / 2;
  const col1X = margin;
  const col2X = margin + colWidth + 10;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  // Column 1
  doc.text('For and on behalf of First Party / Employer:', col1X, y);
  doc.text('Signature: ______________________________', col1X, y + 15);
  doc.text('Name: ___________________________________', col1X, y + 21);
  doc.text('Title: ____________________________________', col1X, y + 27);
  doc.text('Date & Seal: ____________________________', col1X, y + 33);

  // Column 2
  doc.text('For and on behalf of Second Party / Employee:', col2X, y);
  doc.text('Signature: ______________________________', col2X, y + 15);
  doc.text('Name: ___________________________________', col2X, y + 21);
  doc.text('Title: ____________________________________', col2X, y + 27);
  doc.text('Date & Seal: ____________________________', col2X, y + 33);

  // Add Headers & Footers to all generated pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderFooter(i, totalPages);
  }

  // Download
  const filename = `${template.id}.pdf`;
  doc.save(filename);
}
