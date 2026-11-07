import { jsPDF } from 'jspdf';

export function generateComplianceSummaryPDF() {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(22);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text('Annual Tax Compliance Summary', 20, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Assessment Year 2026-27 | Generated on ${new Date().toLocaleDateString()}`, 20, 30);
  
  let yOffset = 45;
  
  // 1. Tax Estimates
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('1. Calculated Tax Estimates', 20, yOffset);
  yOffset += 10;
  
  const savedTaxData = localStorage.getItem('taxCalcData');
  const savedTaxHistory = localStorage.getItem('taxCalcHistory');
  
  doc.setFontSize(12);
  if (savedTaxData || savedTaxHistory) {
    let latestTax = 0;
    let latestIncome = 0;
    
    if (savedTaxHistory) {
      try {
        const history = JSON.parse(savedTaxHistory);
        const latest = history.find((h: any) => h.year === '2026-27');
        if (latest) {
          latestTax = latest.tax;
          latestIncome = latest.income;
        }
      } catch(e) {}
    }
    
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(`Estimated Income: Tk ${latestIncome.toLocaleString()}`, 25, yOffset);
    yOffset += 8;
    doc.text(`Estimated Tax Liability: Tk ${Math.round(latestTax).toLocaleString()}`, 25, yOffset);
  } else {
    doc.setTextColor(148, 163, 184);
    doc.text('No tax calculations saved yet.', 25, yOffset);
  }
  yOffset += 15;
  
  // 2. Checklist Status
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Corporate Compliance Checklist', 20, yOffset);
  yOffset += 10;
  
  const savedChecklist = localStorage.getItem('corporateChecklist');
  
  doc.setFontSize(12);
  if (savedChecklist) {
    try {
      const checklist = JSON.parse(savedChecklist);
      const items = Object.entries(checklist).filter(([_, checked]) => checked);
      
      if (items.length > 0) {
        doc.setTextColor(51, 65, 85);
        items.forEach(([id]) => {
          doc.text(`[X] ${id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`, 25, yOffset);
          yOffset += 8;
          if (yOffset > 270) {
            doc.addPage();
            yOffset = 20;
          }
        });
      } else {
        doc.setTextColor(148, 163, 184);
        doc.text('No checklist items completed.', 25, yOffset);
        yOffset += 8;
      }
    } catch(e) {}
  } else {
    doc.setTextColor(148, 163, 184);
    doc.text('No checklist items completed.', 25, yOffset);
    yOffset += 8;
  }
  yOffset += 7;
  
  // 3. Important Dates
  if (yOffset > 250) {
    doc.addPage();
    yOffset = 20;
  }
  
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Key Compliance Dates', 20, yOffset);
  yOffset += 10;
  
  doc.setFontSize(12);
  doc.setTextColor(51, 65, 85);
  doc.text('- Individual Tax Return: Nov 30, 2026', 25, yOffset);
  yOffset += 8;
  doc.text('- Corporate Tax Return: Jan 15, 2027', 25, yOffset);
  yOffset += 8;
  doc.text('- VAT Return (Monthly): 15th of every month', 25, yOffset);
  
  // Save PDF
  doc.save('Annual_Tax_Compliance_Summary_2026_27.pdf');
}
