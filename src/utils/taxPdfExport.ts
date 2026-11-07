import { jsPDF } from 'jspdf';

// Helper to draw a sleek header on each PDF
function drawReportHeader(doc: jsPDF, title: string, subtitle: string, themeColor: [number, number, number]) {
  // Top Banner
  doc.setFillColor(themeColor[0], themeColor[1], themeColor[2]);
  doc.rect(0, 0, 210, 28, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(title, 14, 13);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(220, 252, 231);
  doc.text(subtitle, 14, 21);

  // Brand Right Corner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('Accounticca × E-Lawyers', 196, 13, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Tax & Regulatory Advisory Division', 196, 19, { align: 'right' });
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`, 196, 24, { align: 'right' });
}

function drawFooter(doc: jsPDF, pageNum: number, pageCount: number = 1) {
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 282, 196, 282);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Confidential tax assessment summary generated for taxpayer compliance and e-Return filing. Subject to NBR verification.', 14, 288);
  doc.text(`Page ${pageNum} of ${pageCount}`, 196, 288, { align: 'right' });
}

// -------------------------------------------------------------
// 1. Investment-Based Tax Rebate PDF
// -------------------------------------------------------------
export interface RebatePDFData {
  taxableIncome: number;
  eligibleInvestment: number;
  limit1_income: number;
  limit2_investment: number;
  limit3_ceiling: number;
  allowableRebate: number;
  limitingTitle: string;
  limitingDesc: string;
  itemized?: {
    dps?: number;
    lifeInsurance?: number;
    govSecurities?: number;
    mutualFundsShares?: number;
    universalPension?: number;
    providentFund?: number;
  };
}

export function generateRebatePDF(data: RebatePDFData) {
  const doc = new jsPDF();
  drawReportHeader(
    doc,
    'INVESTMENT-BASED TAX REBATE ASSESSMENT',
    'Statutory 3-Limit Evaluation under Bangladesh Finance Act 2026 & Income Tax Act, 2023',
    [6, 78, 59] // Emerald 900
  );

  let y = 38;

  // Overview box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(14, y, 182, 32, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(6, 78, 59);
  doc.text('TAXPAYER ASSESSMENT PARAMETERS (AY 2026–2027)', 20, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`Total Taxable Income: BDT ${data.taxableIncome.toLocaleString('en-IN')}`, 20, y + 17);
  doc.text(`Total Eligible Investment: BDT ${data.eligibleInvestment.toLocaleString('en-IN')}`, 20, y + 25);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 78, 59);
  doc.text(`Status: Compliant with Part 3, Sixth Schedule`, 190, y + 17, { align: 'right' });
  doc.text(`AY: 2026–2027 (Finance Act 2026)`, 190, y + 25, { align: 'right' });

  y += 40;

  // The 3 Statutory Limits Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Three Statutory Limits Evaluation', 14, y);
  y += 5;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 8, 'F');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('STATUTORY BENCHMARK', 18, y + 5.5);
  doc.text('LEGAL FORMULA', 85, y + 5.5);
  doc.text('CALCULATED LIMIT', 150, y + 5.5);
  doc.text('STATUS', 190, y + 5.5, { align: 'right' });
  y += 8;

  const limits = [
    {
      name: 'Benchmark 1: Income-Based',
      formula: '3% of Total Taxable Income',
      amount: `BDT ${Math.round(data.limit1_income).toLocaleString('en-IN')}`,
      isLowest: data.allowableRebate === data.limit1_income
    },
    {
      name: 'Benchmark 2: Investment-Based',
      formula: '10% of Eligible Investment',
      amount: `BDT ${Math.round(data.limit2_investment).toLocaleString('en-IN')}`,
      isLowest: data.allowableRebate === data.limit2_investment
    },
    {
      name: 'Benchmark 3: Government Ceiling',
      formula: 'Statutory Maximum Ceiling',
      amount: `BDT ${data.limit3_ceiling.toLocaleString('en-IN')}`,
      isLowest: data.allowableRebate === data.limit3_ceiling
    }
  ];

  limits.forEach((row, i) => {
    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 10, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y + 10, 196, y + 10);

    doc.setFont('helvetica', row.isLowest ? 'bold' : 'normal');
    doc.setFontSize(9);
    doc.setTextColor(row.isLowest ? 6 : 51, row.isLowest ? 78 : 65, row.isLowest ? 59 : 85);
    doc.text(row.name, 18, y + 6.5);
    doc.text(row.formula, 85, y + 6.5);
    doc.text(row.amount, 150, y + 6.5);

    if (row.isLowest) {
      doc.setTextColor(5, 150, 105);
      doc.setFont('helvetica', 'bold');
      doc.text('LOWEST (ALLOWED)', 190, y + 6.5, { align: 'right' });
    } else {
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text('Exceeded', 190, y + 6.5, { align: 'right' });
    }
    y += 10;
  });

  y += 6;

  // Final Allowable Rebate Highlight Card
  doc.setFillColor(6, 78, 59);
  doc.roundedRect(14, y, 182, 34, 3, 3, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(167, 243, 208);
  doc.text('FINAL ALLOWABLE INVESTMENT TAX REBATE (CREDIT)', 20, y + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text(`BDT ${data.allowableRebate.toLocaleString('en-IN')}`, 20, y + 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(209, 250, 229);
  doc.text(`Governing Limitation: ${data.limitingTitle}`, 20, y + 29);
  doc.text('Deducted directly from gross payable tax', 190, y + 29, { align: 'right' });

  y += 42;

  // Advisory Commentary
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, 182, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Statutory Advisory Note:', 19, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(doc.splitTextToSize(data.limitingDesc, 172), 19, y + 13);

  y += 28;

  // Itemized investments if present
  if (data.itemized) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Itemized Qualifying Investment Breakdown', 14, y);
    y += 5;

    const items = [
      { label: 'Deposit Pension Scheme (DPS) [Max BDT 1,20,000]', val: data.itemized.dps || 0 },
      { label: 'Life Insurance Premium [Max 10% sum assured]', val: data.itemized.lifeInsurance || 0 },
      { label: 'Government Securities & Treasury Bonds', val: data.itemized.govSecurities || 0 },
      { label: 'Listed Mutual Funds & Capital Market Securities', val: data.itemized.mutualFundsShares || 0 },
      { label: 'Universal Pension Scheme (UPS) Contributions', val: data.itemized.universalPension || 0 },
      { label: 'Recognized Provident Fund (RPF) Contributions', val: data.itemized.providentFund || 0 },
    ];

    items.forEach((it, idx) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(it.label, 18, y + 4);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`BDT ${it.val.toLocaleString('en-IN')}`, 190, y + 4, { align: 'right' });
      doc.setDrawColor(241, 245, 249);
      doc.line(14, y + 7, 196, y + 7);
      y += 7;
    });
  }

  // Key Rule Change Box
  y = Math.max(y + 2, 235);
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(251, 191, 36);
  doc.roundedRect(14, y, 182, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(146, 64, 14);
  doc.text('Finance Act 2026 Key Revisions:', 18, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 83, 9);
  doc.text('1. Investment rebate rate reduced from 15% to 10%.', 18, y + 11);
  doc.text('2. Maximum government rebate ceiling reduced from Tk. 10 Lakh to Tk. 7.5 Lakh (Tk. 7,50,000).', 18, y + 15);

  drawFooter(doc, 1, 1);
  doc.save(`Tax_Rebate_Assessment_AY2026-27_${Date.now()}.pdf`);
}

// -------------------------------------------------------------
// 2. Minimum Turnover Tax PDF
// -------------------------------------------------------------
export interface TurnoverPDFData {
  turnover: number;
  slabLabel: string;
  rateLabel: string;
  currentTax: number;
  previousTax: number;
  savings: number;
  savingsPercent: string;
  isLossMaking: boolean;
}

export function generateTurnoverPDF(data: TurnoverPDFData) {
  const doc = new jsPDF();
  drawReportHeader(
    doc,
    'MINIMUM TURNOVER TAX ASSESSMENT REPORT',
    'NBR 3-Tier Slabs Structure under Bangladesh Income Tax Act, 2023',
    [49, 46, 129] // Indigo 900
  );

  let y = 38;

  // Overview Card
  doc.setFillColor(238, 242, 255);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(14, y, 182, 34, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(49, 46, 129);
  doc.text('BUSINESS TURNOVER ASSESSMENT (AY 2026–2027)', 20, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`Annual Gross Sales / Turnover: BDT ${data.turnover.toLocaleString('en-IN')}`, 20, y + 17);
  doc.text(`Turnover Volume: Tk. ${(data.turnover / 10000000).toFixed(2)} Crore`, 20, y + 24);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(data.isLossMaking ? 180 : 49, data.isLossMaking ? 83 : 46, data.isLossMaking ? 9 : 129);
  doc.text(`Operational Status: ${data.isLossMaking ? 'Loss-Making (Turnover Floor Applies)' : 'Normal Operations'}`, 190, y + 17, { align: 'right' });
  doc.setTextColor(49, 46, 129);
  doc.text(`NBR Structure: 3-Tier Progressive Slabs`, 190, y + 24, { align: 'right' });

  y += 42;

  // Slabs Breakdown Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('NBR Restructured Turnover Slabs Tier Evaluation', 14, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 8, 'F');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('SLAB TIER', 18, y + 5.5);
  doc.text('ANNUAL TURNOVER RANGE', 60, y + 5.5);
  doc.text('STATUTORY RATE', 125, y + 5.5);
  doc.text('APPLICABILITY', 190, y + 5.5, { align: 'right' });
  y += 8;

  const tiers = [
    { tier: 'Slab 1', range: 'Up to Tk. 2 Crore (Tk. 20M)', rate: '0% (Tax-Free)', match: data.turnover <= 20000000 },
    { tier: 'Slab 2', range: 'Above Tk. 2 Cr to Tk. 4 Crore', rate: '0.5%', match: data.turnover > 20000000 && data.turnover <= 40000000 },
    { tier: 'Slab 3', range: 'Above Tk. 4 Crore (Tk. 40M+)', rate: '1.0%', match: data.turnover > 40000000 }
  ];

  tiers.forEach(t => {
    if (t.match) {
      doc.setFillColor(238, 242, 255);
      doc.rect(14, y, 182, 10, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y + 10, 196, y + 10);

    doc.setFont('helvetica', t.match ? 'bold' : 'normal');
    doc.setFontSize(9);
    doc.setTextColor(t.match ? 49 : 51, t.match ? 46 : 65, t.match ? 129 : 85);
    doc.text(t.tier, 18, y + 6.5);
    doc.text(t.range, 60, y + 6.5);
    doc.text(t.rate, 125, y + 6.5);

    if (t.match) {
      doc.setTextColor(79, 70, 229);
      doc.setFont('helvetica', 'bold');
      doc.text('ACTIVE TIER', 190, y + 6.5, { align: 'right' });
    } else {
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text('—', 190, y + 6.5, { align: 'right' });
    }
    y += 10;
  });

  y += 6;

  // Main Tax Result Box
  doc.setFillColor(49, 46, 129);
  doc.roundedRect(14, y, 182, 34, 3, 3, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(199, 210, 254);
  doc.text('PAYABLE MINIMUM TURNOVER TAX LIABILITY', 20, y + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text(`BDT ${data.currentTax.toLocaleString('en-IN')}`, 20, y + 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(224, 231, 255);
  doc.text(`Applied Rate: ${data.rateLabel} | ${data.slabLabel}`, 20, y + 29);
  doc.text(data.currentTax === 0 ? '100% Tax-Free under Tk. 2 Cr Exemption' : `Tk. ${(data.currentTax / 100000).toFixed(2)} Lakh`, 190, y + 29, { align: 'right' });

  y += 42;

  // Comparison & Savings Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Comparison: Revised Slabs vs. Hypothetical 1% Flat Proposal', 14, y);
  y += 5;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, 182, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Previous Flat 1% Proposal:', 20, y + 9);
  doc.text(`BDT ${data.previousTax.toLocaleString('en-IN')} (Flat 1% on all turnover)`, 85, y + 9);

  doc.text('Revised Restructured Slabs Tax:', 20, y + 17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(49, 46, 129);
  doc.text(`BDT ${data.currentTax.toLocaleString('en-IN')} (${data.rateLabel})`, 85, y + 17);

  doc.setDrawColor(226, 232, 240);
  doc.line(20, y + 23, 190, y + 23);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text('Direct Tax Liquidity Saved:', 20, y + 31);
  doc.setFontSize(11);
  doc.text(`BDT ${data.savings.toLocaleString('en-IN')} (${data.savingsPercent}% reduction)`, 85, y + 31);

  y += 46;

  // Loss-Making & Practical Considerations Box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(14, y, 182, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(6, 78, 59);
  doc.text('Statutory Minimum Tax & Loss-Making Rules (Section 163):', 19, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(21, 128, 61);
  doc.text('1. Whichever is higher between normal corporate income tax on profit and minimum turnover tax governs final liability.', 19, y + 13);
  doc.text('2. If operational losses are incurred, regular profit tax is Tk. 0; the turnover tax operates as the statutory baseline floor.', 19, y + 18);
  doc.text('3. Advance Income Tax (AIT) and source tax (TDS) under Sections 89, 90, and 120 adjust directly against this turnover tax.', 19, y + 23);

  drawFooter(doc, 1, 1);
  doc.save(`Minimum_Turnover_Tax_Report_AY2026-27_${Date.now()}.pdf`);
}

// -------------------------------------------------------------
// 3. Agricultural Income Tax PDF
// -------------------------------------------------------------
export interface AgriTaxPDFData {
  totalReceipts: number;
  maintainFormalRecords: boolean;
  calculatedExpenses: number;
  netIncome: number;
  isFarmerByOccupation: boolean;
  noOtherSignificantIncome: boolean;
  clause20Exemption: number;
  taxableIncome: number;
  category: string;
  disabledDependentsCount?: number;
  basicThreshold: number;
  taxPayable: number;
  effectiveRate: string;
  slabs: Array<{ label: string; rate: string; amount: number; tax: number }>;
  taxYear?: string;
  comparison?: {
    prevYearTax: number;
    diff: number;
    prevYearName: string;
  };
}

export function generateAgriTaxPDF(data: AgriTaxPDFData) {
  const doc = new jsPDF();
  const yearTitle = data.taxYear || 'AY 2026–2027';
  drawReportHeader(
    doc,
    'AGRICULTURAL INCOME TAX ASSESSMENT REPORT',
    `Sections 40–44 & Sixth Schedule Part 1 Clause 20 (${yearTitle})`,
    [6, 95, 70] // Emerald 800
  );

  let y = 38;

  // Overview Box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(14, y, 182, 34, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(6, 95, 70);
  doc.text(`AGRICULTURAL PRODUCE & STATUTORY PARAMETERS (${yearTitle})`, 20, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`Total Agricultural Receipts: BDT ${data.totalReceipts.toLocaleString('en-IN')}`, 20, y + 17);
  doc.text(`Expense Method: ${data.maintainFormalRecords ? 'Section 42 (Verified Actual Expenses)' : 'Section 43 (60% Deemed Expense Rate)'}`, 20, y + 24);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70);
  doc.text(`Allowable Expenses: BDT ${data.calculatedExpenses.toLocaleString('en-IN')}`, 190, y + 17, { align: 'right' });
  doc.text(`Net Agri Income: BDT ${data.netIncome.toLocaleString('en-IN')}`, 190, y + 24, { align: 'right' });

  y += 42;

  // Clause 20 Exemption Evaluation
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Sixth Schedule, Part 1, Clause 20 Exemption (BDT 2 Lakh)', 14, y);
  y += 5;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, 182, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Condition 1: Farmer by Occupation:`, 20, y + 7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(data.isFarmerByOccupation ? 5 : 225, data.isFarmerByOccupation ? 150 : 29, data.isFarmerByOccupation ? 105 : 72);
  doc.text(data.isFarmerByOccupation ? 'SATISFIED (YES)' : 'NOT SATISFIED', 185, y + 7, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Condition 2: Outside Income <= 20k:`, 20, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(data.noOtherSignificantIncome ? 5 : 225, data.noOtherSignificantIncome ? 150 : 29, data.noOtherSignificantIncome ? 105 : 72);
  doc.text(data.noOtherSignificantIncome ? 'SATISFIED (YES)' : 'NOT SATISFIED', 185, y + 14, { align: 'right' });

  doc.setDrawColor(226, 232, 240);
  doc.line(20, y + 19, 185, y + 19);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70);
  doc.text(`Clause 20 Deducted Exemption:`, 20, y + 25);
  doc.text(`BDT ${data.clause20Exemption.toLocaleString('en-IN')}`, 185, y + 25, { align: 'right' });

  y += 34;

  // Taxable Amount & Final Tax Card
  doc.setFillColor(6, 95, 70);
  doc.roundedRect(14, y, 182, 34, 3, 3, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(167, 243, 208);
  doc.text(`FINAL AGRICULTURAL TAX PAYABLE (${yearTitle})`, 20, y + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text(`BDT ${data.taxPayable.toLocaleString('en-IN')}`, 20, y + 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(209, 250, 229);
  doc.text(`Total Taxable Income: BDT ${data.taxableIncome.toLocaleString('en-IN')}`, 20, y + 29);
  doc.text(`Tax-Free Threshold: BDT ${data.basicThreshold.toLocaleString('en-IN')} | Effective Rate: ${data.effectiveRate}%`, 190, y + 29, { align: 'right' });

  y += 42;

  // Optional Multi-Year Comparison Box if present
  if (data.comparison) {
    doc.setFillColor(238, 242, 255);
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(14, y, 182, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(49, 46, 129);
    doc.text('Assessment Year Comparison (AY 2025–26 vs. AY 2026–27):', 20, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Previous Year (${data.comparison.prevYearName}) Tax: BDT ${data.comparison.prevYearTax.toLocaleString('en-IN')}`, 20, y + 14);

    doc.setFont('helvetica', 'bold');
    if (data.comparison.diff < 0) {
      doc.setTextColor(5, 150, 105);
      doc.text(`Net Tax Savings in 2026-27: -BDT ${Math.abs(data.comparison.diff).toLocaleString('en-IN')} (Relief due to +Tk 50k Threshold)`, 190, y + 14, { align: 'right' });
    } else if (data.comparison.diff > 0) {
      doc.setTextColor(180, 83, 9);
      doc.text(`Net Tax Variance: +BDT ${data.comparison.diff.toLocaleString('en-IN')} (5% slab eliminated/30% bracket)`, 190, y + 14, { align: 'right' });
    } else {
      doc.setTextColor(79, 70, 229);
      doc.text(`Identical Tax Liability across both years`, 190, y + 14, { align: 'right' });
    }
    y += 28;
  }

  // Progressive Slabs Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Progressive Slab Breakdown (${yearTitle})`, 14, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, 'F');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('TAX SLAB TIER', 18, y + 5);
  doc.text('RATE', 85, y + 5);
  doc.text('TAXABLE PORTION', 135, y + 5);
  doc.text('TAX AMOUNT', 190, y + 5, { align: 'right' });
  y += 7;

  data.slabs.forEach((s, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 8, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y + 8, 196, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(s.label, 18, y + 5.5);
    doc.text(s.rate, 85, y + 5.5);
    doc.text(`BDT ${s.amount.toLocaleString('en-IN')}`, 135, y + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`BDT ${s.tax.toLocaleString('en-IN')}`, 190, y + 5.5, { align: 'right' });
    y += 8;
  });

  drawFooter(doc, 1, 1);
  doc.save(`Agricultural_Tax_Assessment_${yearTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`);
}

// -------------------------------------------------------------
// 4. Corporate Tax Rates & Comparison PDF (FY 2026-27)
// -------------------------------------------------------------
export interface CorporateTaxPDFData {
  companyName?: string;
  taxableProfit: number;
  categoryLabel: string;
  isBankingCompliant: boolean;
  baseRate: number;
  effectiveRate: number;
  penaltyRate: number;
  taxPayable: number;
  penaltyAmount: number;
  nonListedTax: number;
  listedOver10Tax: number;
  listedUnder10Tax: number;
  savingsOver10: number;
  savingsUnder10: number;
}

export function generateCorporateTaxPDF(data: CorporateTaxPDFData) {
  const doc = new jsPDF();

  // Draw Header Banner
  drawReportHeader(
    doc,
    'Corporate Tax Assessment & Slabs (FY 2026-27)',
    'Bangladesh Income Tax Act, 2023 & Proposed Budget 5-Year Roadmap',
    [15, 23, 42] // Slate 900
  );

  let y = 36;

  // Title Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('CORPORATE INCOME TAX SUMMARY & CAPITAL MARKET COMPARISON', 14, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Company Entity: ${data.companyName || 'Corporate Assessee'} | Assessment Year: 2027–2028 (FY 2026–2027)`, 14, y);
  y += 8;

  // Primary Assessment Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, 182, 38, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('SELECTED ENTITY PROFILE & APPLICABLE RATE', 20, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Company Category: ${data.categoryLabel}`, 20, y + 16);
  doc.text(`Banking Channels Compliance: ${data.isBankingCompliant ? 'COMPLIANT (100% formal bank transactions)' : 'NON-COMPLIANT (+2.5% penalty applies)'}`, 20, y + 23);
  doc.text(`Statutory Standard Rate: ${(data.baseRate * 100).toFixed(1)}% | Effective Rate: ${(data.effectiveRate * 100).toFixed(1)}%`, 20, y + 30);

  // Right Side Highlight Box
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(132, y + 4, 58, 30, 2, 2, 'F');
  doc.setTextColor(226, 232, 240);
  doc.setFontSize(7.5);
  doc.text('TOTAL TAX PAYABLE', 161, y + 11, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(52, 211, 153);
  doc.text(`BDT ${data.taxPayable.toLocaleString('en-IN')}`, 161, y + 20, { align: 'center' });
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`(${(data.effectiveRate * 100).toFixed(1)}% effective rate)`, 161, y + 27, { align: 'center' });

  y += 44;

  // Key Financial Metrics Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Financial Assessment Metrics', 14, y);
  y += 5;

  const metrics = [
    { label: 'Annual Taxable Net Profit', val: `BDT ${data.taxableProfit.toLocaleString('en-IN')}` },
    { label: 'Standard Compliant Tax Rate', val: `${(data.baseRate * 100).toFixed(1)}%` },
    { label: 'Banking Channel Penalty (Non-Compliance)', val: data.isBankingCompliant ? 'BDT 0 (No Penalty)' : `+BDT ${data.penaltyAmount.toLocaleString('en-IN')} (+2.5%)` },
    { label: 'Final Corporate Tax Liability', val: `BDT ${data.taxPayable.toLocaleString('en-IN')}` }
  ];

  metrics.forEach((m, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
    doc.rect(14, y, 182, 7.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y + 7.5, 196, y + 7.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(m.label, 18, y + 5.2);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(m.val, 190, y + 5.2, { align: 'right' });
    y += 7.5;
  });

  y += 8;

  // Multi-Company Comparison Matrix
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Comparative Corporate Tax Analysis (Identical Profit)', 14, y);
  y += 5;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 8, 'F');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('ENTITY CLASSIFICATION', 18, y + 5.5);
  doc.text('NORMAL', 82, y + 5.5);
  doc.text('WITH PENALTY', 112, y + 5.5);
  doc.text('CURRENT STATUS TAX', 150, y + 5.5);
  doc.text('SAVINGS VS UNLISTED', 194, y + 5.5, { align: 'right' });
  y += 8;

  const rows = [
    {
      name: 'Non-Listed Company (Private Ltd / OPC)',
      normal: '27.5%',
      penalty: '30.0%',
      tax: data.nonListedTax,
      savings: 'Baseline (0)'
    },
    {
      name: 'Listed Company (IPO > 10% of Capital)',
      normal: '20.0%',
      penalty: '22.5%',
      tax: data.listedOver10Tax,
      savings: `Save BDT ${data.savingsOver10.toLocaleString('en-IN')}`
    },
    {
      name: 'Other Listed Company (IPO <= 10%)',
      normal: '25.0%',
      penalty: '27.5%',
      tax: data.listedUnder10Tax,
      savings: `Save BDT ${data.savingsUnder10.toLocaleString('en-IN')}`
    }
  ];

  rows.forEach((r, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 8.5, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y + 8.5, 196, y + 8.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(r.name, 18, y + 5.8);
    doc.text(r.normal, 82, y + 5.8);
    doc.text(r.penalty, 112, y + 5.8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`BDT ${r.tax.toLocaleString('en-IN')}`, 150, y + 5.8);

    if (idx > 0) {
      doc.setTextColor(5, 150, 105);
    } else {
      doc.setTextColor(100, 116, 139);
    }
    doc.text(r.savings, 194, y + 5.8, { align: 'right' });
    y += 8.5;
  });

  y += 8;

  // Regulatory Guidance Box
  doc.setFillColor(240, 253, 250);
  doc.setDrawColor(153, 246, 228);
  doc.roundedRect(14, y, 182, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(19, 78, 74);
  doc.text('CRITICAL COMPLIANCE DIRECTIVES (NBR FY 2026-27):', 18, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 118, 110);
  doc.text('1. Formal Banking Requirement: All sales proceeds, loan receipts, and operational expenses exceeding statutory thresholds', 18, y + 14);
  doc.text('   must be transacted through crossed bank cheque, bank transfer, or recognized digital gateway to avoid the 2.5% penalty.', 18, y + 19);
  doc.text('2. Capital Market Incentives: Public listing with >10% IPO issuance unlocks the maximum 7.5% corporate tax rate reduction.', 18, y + 25);
  doc.text('3. Five-Year Stability: Proposed rates provide multi-year planning certainty under the government five-year tax roadmap.', 18, y + 30);

  drawFooter(doc, 1, 1);
  doc.save(`Corporate_Tax_Assessment_${Date.now()}.pdf`);
}
