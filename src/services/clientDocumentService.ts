import { collection, doc, getDocs, setDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { jsPDF } from 'jspdf';

export interface ClientDocument {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Tax Filings & NBR' | 'Legal Deeds & Contracts' | 'VAT & Customs' | 'Assurance & Audit' | 'Advisory Memos';
  fileType: 'pdf' | 'docx' | 'xlsx' | 'cert';
  fileSize: string;
  sharedDate: string; // YYYY-MM-DD
  lastUpdated: string;
  consultationRef?: string; // Reference ID e.g. APT-2026-84920
  practiceArea?: string; // e.g. 'Income Tax Assessment & NBR Defense'
  status: 'Certified' | 'Filed' | 'Ready for Signature' | 'Client Review Required' | 'Chamber Scoping';
  author: {
    name: string;
    role: string;
    division: 'Accounticca Advisory' | 'E-Lawyers Chambers';
  };
  summary: string;
  contentPreview?: string;
  isConfidential?: boolean;
  uploadedByClient?: boolean;
  clientNotes?: string;
  verificationCode?: string;
}

const COLLECTION_NAME = 'client_documents';
const LOCAL_STORAGE_PREFIX = 'accounticca_client_documents_';

export function getSeedClientDocuments(userName: string, userEmail: string): ClientDocument[] {
  const today = new Date().toISOString().split('T')[0];
  const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];

  return [
    {
      id: 'doc-tax-order-2026',
      title: 'Corporate Income Tax Assessment Order (AY 2026-27)',
      subtitle: 'Official assessment review under Section 73 of Income Tax Act 2023',
      category: 'Tax Filings & NBR',
      fileType: 'pdf',
      fileSize: '1.8 MB',
      sharedDate: lastWeek,
      lastUpdated: today,
      consultationRef: 'APT-2026-92810',
      practiceArea: 'Income Tax Assessment & NBR Defense',
      status: 'Certified',
      author: {
        name: 'Khandakar & Advisory Partners',
        role: 'Senior Income Tax Practitioner (ITP) & FCA',
        division: 'Accounticca Advisory'
      },
      summary: 'Comprehensive scrutiny report confirming allowable depreciation, TDS credit reconciliation of BDT 420,000, and minimum tax optimization schedule.',
      contentPreview: `INCOME TAX ASSESSMENT VETTING REPORT
Client: ${userName || 'Corporate Client'}
Assessment Year: 2026-2027 | Applicable Law: Income Tax Act, 2023
Taxes Circle: Circle-14, Taxes Zone-07, Dhaka

1. EXECUTIVE FINDINGS
Our chambers examined the return filed under Section 75 alongside audited financial statements. The initial disallowance proposed under Section 49 was successfully rebutted via proof of banking transaction compliance.

2. TAX COMPUTATION SUMMARY
- Gross Business Revenue: BDT 14,800,000
- Admissible Deductions & Depreciation: BDT 11,250,000
- Net Taxable Business Income: BDT 3,550,000
- Applicable Corporate Tax Rate: 27.5%
- Gross Tax Liability: BDT 976,250
- Less Advance Income Tax (AIT & TDS credits verified): (BDT 550,000)
- Net Payable / Settled: BDT 426,250

3. CHAMBER OPINION & COMPLIANCE STAMP
The documentation has been certified and cross-verified with NBR e-TIN database. Retain this certified assessment docket for bank financing and statutory RJSC filings.`,
      isConfidential: true,
      verificationCode: 'NBR-ACC-74829'
    },
    {
      id: 'doc-vat-mushak91',
      title: 'Mushak 9.1 Return Reconciliation & Input Tax Rebate Docket',
      subtitle: 'Value Added Tax reconciliation & treasury challan verification',
      category: 'VAT & Customs',
      fileType: 'pdf',
      fileSize: '2.4 MB',
      sharedDate: twoWeeksAgo,
      lastUpdated: lastWeek,
      consultationRef: 'APT-2026-38205',
      practiceArea: 'VAT & SD Act Compliance & Reconciliations',
      status: 'Filed',
      author: {
        name: 'Accredited VAT Advisory Group',
        role: 'NBR Certified VAT Consultant & Cost Management Accountant',
        division: 'Accounticca Advisory'
      },
      summary: 'Verified Mushak 9.1 monthly return submission with treasury deposit challans and Section 46 input rebate coefficient verification (Mushak 4.3).',
      contentPreview: `VALUE ADDED TAX (VAT) RECONCILIATION SUMMARY
Entity BIN: 002948172-0101 (13-digit Registered Entity)
Commissionerate: Large Taxpayers Unit (LTU) / Dhaka South VAT Commissionerate
Filing Reference: MUSHAK-9.1-2026-OCT

1. RETURN RECONCILIATION
- Total Taxable Sales (Supply): BDT 8,920,000
- Output VAT Payable @ 15%: BDT 1,338,000
- Admissible Input Tax Rebate (Sub-Form purchases): (BDT 840,000)
- Net Treasury Payment Made via e-Payment: BDT 498,000

2. REBATE COMPLIANCE
All purchase invoices exceeding BDT 100,000 complied with banking channel settlement under Section 46 of the VAT & SD Act 2012. Treasury challan counterfoils attached.`,
      isConfidential: true,
      verificationCode: 'VAT-NBR-2026-993'
    },
    {
      id: 'doc-corp-writ',
      title: 'High Court Commercial Writ Petition & Interim Injunction Brief',
      subtitle: 'Constitutional commercial petition under Article 102 of the Constitution',
      category: 'Legal Deeds & Contracts',
      fileType: 'docx',
      fileSize: '950 KB',
      sharedDate: lastWeek,
      lastUpdated: today,
      consultationRef: 'APT-2026-49210',
      practiceArea: 'Corporate Law & Commercial Litigation',
      status: 'Ready for Signature',
      author: {
        name: 'Advocate Supreme Court of Bangladesh',
        role: 'Barrister-at-Law & Senior Commercial Benches Lead',
        division: 'E-Lawyers Chambers'
      },
      summary: 'Draft writ petition challenging unlawful demand notice with application for stay of enforcement before the High Court Division, Supreme Court of Bangladesh.',
      contentPreview: `IN THE SUPREME COURT OF BANGLADESH
HIGH COURT DIVISION
(SPECIAL ORIGINAL JURISDICTION)
WRIT PETITION NO. _______ OF 2026

IN THE MATTER OF:
An application under Article 102 of the Constitution of the People's Republic of Bangladesh.
AND
IN THE MATTER OF:
${userName || 'Petitioner Organization'}, represented by its Managing Director.
... PETITIONER
-VERSUS-
The Government of Bangladesh, represented by Secretary, Ministry of Finance, and others.
... RESPONDENTS

GROUNDS OF THE PETITION:
I. FOR THAT the impugned notice dated 14.09.2026 issued without granting statutory opportunity of hearing is violative of the principles of natural justice.
II. FOR THAT the demand is contrary to settled judicial precedents of the Appellate Division in 52 DLR (AD) 112.

PRAYER:
Direct respondents to show cause why the impugned notice shall not be declared null and void, and stay all coercive recoveries pending hearing.`,
      isConfidential: true,
      verificationCode: 'SCB-HCD-81724'
    },
    {
      id: 'doc-rjsc-moa',
      title: 'RJSC Certified Articles of Association & Form XII Extract',
      subtitle: 'Entity statutory records and register of directors approved by RJSC',
      category: 'Legal Deeds & Contracts',
      fileType: 'cert',
      fileSize: '1.2 MB',
      sharedDate: twoWeeksAgo,
      lastUpdated: twoWeeksAgo,
      practiceArea: 'RJSC Company Incorporation & Secretarial',
      status: 'Certified',
      author: {
        name: 'Chambers Registrar & Corporate Affairs Lead',
        role: 'Senior Corporate Secretarial Counsel (ICSB)',
        division: 'E-Lawyers Chambers'
      },
      summary: 'Certified true copy of Memorandum and Articles of Association including share allotment records and Form XII listing currently appointed directors.',
      contentPreview: `REGISTRAR OF JOINT STOCK COMPANIES & FIRMS (RJSC)
PEOPLE'S REPUBLIC OF BANGLADESH
CERTIFIED STATUTORY EXTRACT (COMPANIES ACT, 1994)

Entity Name: ${userName ? `${userName.split(' ')[0]} Holdings Ltd.` : 'Apex Strategic Solutions Ltd.'}
Incorporation No: C-184920/2024 | Type: Private Company Limited by Shares

1. CAPITAL STRUCTURE
- Authorized Share Capital: BDT 50,000,000 divided into 500,000 Ordinary Shares of BDT 100 each.
- Paid-Up Share Capital: BDT 10,000,000 fully paid.

2. REGISTER OF DIRECTORS (FORM XII)
- Director 1: ${userName || 'Corporate Executive'} (Managing Director)
- Director 2: Senior Director / Shareholder
Statutory annual return filing confirmed for the preceding fiscal period.`,
      isConfidential: true,
      verificationCode: 'RJSC-REG-44910'
    },
    {
      id: 'doc-audit-report',
      title: 'Independent Auditor’s Report & Audited Financial Statements',
      subtitle: 'Statutory audit with Document Verification Code (DVC) by ICAB FCA',
      category: 'Assurance & Audit',
      fileType: 'pdf',
      fileSize: '3.1 MB',
      sharedDate: lastWeek,
      lastUpdated: today,
      practiceArea: 'Statutory Financial Audit & Assurance',
      status: 'Certified',
      author: {
        name: 'Fellow Chartered Accountant (FCA) Assurance Partner',
        role: 'Partner - Audit, Assurance & ICAB Attestations',
        division: 'Accounticca Advisory'
      },
      summary: 'Unqualified statutory audit report with DVC generation, detailed notes on accounts, and internal controls management letter for corporate governance.',
      contentPreview: `INDEPENDENT AUDITOR'S REPORT
To the Shareholders of ${userName || 'The Corporate Entity'}

OPINION:
We have audited the financial statements which comprise the Statement of Financial Position as at June 30, 2026, and the Statement of Profit or Loss and Other Comprehensive Income, Statement of Changes in Equity, and Statement of Cash Flows for the year then ended.

In our opinion, the accompanying financial statements present fairly, in all material respects, the financial position of the Company in accordance with International Financial Reporting Standards (IFRS) and the Companies Act, 1994.

DVC CODE: 261015-DVC-772910-FCA
ICAB Licensed Practice Firm: Chamber 4A, Panthapath Chambers, Dhaka.`,
      isConfidential: true,
      verificationCode: 'DVC-ICAB-261015'
    },
    {
      id: 'doc-advisory-scoping',
      title: 'Executive Pre-Consultation Strategy & Regulatory Scoping Memo',
      subtitle: 'Joint chambers assessment delivered ahead of executive consultation',
      category: 'Advisory Memos',
      fileType: 'pdf',
      fileSize: '780 KB',
      sharedDate: today,
      lastUpdated: today,
      consultationRef: 'APT-2026-92810',
      status: 'Chamber Scoping',
      author: {
        name: 'Joint Executive Practice Desk',
        role: 'Accounticca Advisory × E-Lawyers Chambers',
        division: 'Accounticca Advisory'
      },
      summary: 'Tailored briefing paper outlining key risk areas, statutory tax deadlines, and court timeline for upcoming executive session.',
      contentPreview: `EXECUTIVE ADVISORY MEMO
To: ${userName || 'Corporate Leadership'} (${userEmail || 'Client Desk'})
From: Accounticca & E-Lawyers Chambers Partner Desk
Date: ${today} | Matter: Comprehensive Regulatory & Tax Optimization

SUMMARY OF KEY ACTION POINTS FOR CONSULTATION:
1. NBR Show-Cause Defense: Submit documentary invoices regarding deductible salary & allowances prior to next hearing.
2. High Court Motion: Execute vakalatnama and affidavit for commercial bench filing before next motion day.
3. Cash Runway & Tax Optimization: Avail statutory investment tax rebate under 6th Schedule of Income Tax Act 2023.

We look forward to addressing these during our scheduled session.`,
      isConfidential: false,
      verificationCode: 'MEMO-ACC-2026-01'
    }
  ];
}

/**
 * Fetch client documents from Firestore and localStorage
 */
export async function fetchClientDocuments(userId: string, userName?: string, userEmail?: string): Promise<ClientDocument[]> {
  const docsMap = new Map<string, ClientDocument>();

  // 1. Try Firestore
  try {
    const docsRef = collection(db, COLLECTION_NAME);
    const q = query(docsRef, where('userId', '==', userId));
    const snap = await getDocs(q);
    snap.forEach(d => {
      const data = d.data() as ClientDocument;
      docsMap.set(d.id, { ...data, id: d.id });
    });
  } catch (err) {
    console.warn('Note: Could not query Firestore client_documents:', err);
  }

  // 2. Try localStorage user-uploaded / cached documents
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${userId}`);
    if (raw) {
      const parsed: ClientDocument[] = JSON.parse(raw);
      parsed.forEach(docItem => {
        if (!docsMap.has(docItem.id)) {
          docsMap.set(docItem.id, docItem);
        }
      });
    }
  } catch {
    // ignore
  }

  // 3. If empty or initial, seed with realistic curated documents for the authenticated client
  if (docsMap.size === 0) {
    const seedDocs = getSeedClientDocuments(userName || 'Client Partner', userEmail || 'client@accounticca.com');
    seedDocs.forEach(d => docsMap.set(d.id, d));
    // cache in localStorage
    try {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${userId}`, JSON.stringify(seedDocs));
    } catch {
      // ignore
    }
  }

  return Array.from(docsMap.values()).sort((a, b) => new Date(b.sharedDate).getTime() - new Date(a.sharedDate).getTime());
}

/**
 * Upload / create a new client document
 */
export async function saveClientDocument(userId: string, newDoc: Omit<ClientDocument, 'id'>): Promise<ClientDocument> {
  const docId = `doc-${Date.now()}`;
  const fullDoc: ClientDocument = {
    ...newDoc,
    id: docId
  };

  // 1. Try Firestore
  try {
    const docRef = doc(db, COLLECTION_NAME, docId);
    await setDoc(docRef, {
      ...fullDoc,
      userId,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Firestore document save fallback to local:', err);
  }

  // 2. Save locally
  try {
    const existingRaw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${userId}`);
    const existing: ClientDocument[] = existingRaw ? JSON.parse(existingRaw) : [];
    const updated = [fullDoc, ...existing];
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${userId}`, JSON.stringify(updated));
  } catch {
    // ignore
  }

  return fullDoc;
}

/**
 * Generate formatted PDF for client document download
 */
export function downloadClientDocumentPDF(clientDoc: ClientDocument): void {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  // Header Bar
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.rect(0, 0, pageWidth, 6, 'F');

  // Top Chambers Header
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text('ACCOUNTICCA ADVISORY × E-LAWYERS CHAMBERS • CLIENT PORTAL VAULT', margin, 14);
  pdf.text('CONFIDENTIAL CLIENT PRIVILEGE', pageWidth - margin, 14, { align: 'right' });

  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.line(margin, 17, pageWidth - margin, 17);

  y = 26;

  // Category Badge
  pdf.setFillColor(236, 253, 245); // emerald-50
  pdf.rect(margin, y, 55, 6, 'F');
  pdf.setFontSize(8);
  pdf.setTextColor(5, 150, 105); // emerald-600
  pdf.setFont('helvetica', 'bold');
  pdf.text(clientDoc.category.toUpperCase(), margin + 3, y + 4.2);

  // Status Badge
  pdf.setFont('helvetica', 'bold');
  pdf.text(`STATUS: ${clientDoc.status.toUpperCase()}`, pageWidth - margin, y + 4.2, { align: 'right' });

  y += 12;

  // Document Title
  pdf.setFontSize(16);
  pdf.setTextColor(15, 23, 42);
  pdf.setFont('helvetica', 'bold');
  const titleLines = pdf.splitTextToSize(clientDoc.title, contentWidth);
  pdf.text(titleLines, margin, y);
  y += titleLines.length * 7;

  // Subtitle
  if (clientDoc.subtitle) {
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    const subLines = pdf.splitTextToSize(clientDoc.subtitle, contentWidth);
    pdf.text(subLines, margin, y);
    y += subLines.length * 5 + 3;
  }

  // Meta Box
  pdf.setFillColor(248, 250, 252); // slate-50
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184); // slate-400
  pdf.text('AUTHOR / CHAMBER LEAD', margin + 4, y + 6);
  pdf.text('DATE SHARED', margin + 70, y + 6);
  pdf.text('VERIFICATION CODE', margin + 120, y + 6);

  pdf.setFontSize(9);
  pdf.setTextColor(15, 23, 42);
  pdf.setFont('helvetica', 'bold');
  pdf.text(clientDoc.author.name, margin + 4, y + 12);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text(clientDoc.author.division, margin + 4, y + 17);

  pdf.setFontSize(9);
  pdf.setTextColor(15, 23, 42);
  pdf.setFont('helvetica', 'bold');
  pdf.text(clientDoc.sharedDate, margin + 70, y + 12);
  if (clientDoc.consultationRef) {
    pdf.setFontSize(8);
    pdf.setTextColor(5, 150, 105);
    pdf.text(`Ref: ${clientDoc.consultationRef}`, margin + 70, y + 17);
  }

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text(clientDoc.verificationCode || `VER-${clientDoc.id.slice(-6).toUpperCase()}`, margin + 120, y + 12);

  y += 28;

  // Summary Header
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text('Executive Summary & Scope', margin, y);
  y += 6;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(51, 65, 85);
  const summaryLines = pdf.splitTextToSize(clientDoc.summary, contentWidth);
  pdf.text(summaryLines, margin, y);
  y += summaryLines.length * 5 + 6;

  // Content Preview / Official Text
  if (clientDoc.contentPreview) {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text('Document Provisions & Full Matter Record', margin, y);
    y += 6;

    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(71, 85, 105);

    const bodyLines = pdf.splitTextToSize(clientDoc.contentPreview, contentWidth);
    
    // Check page limits
    if (y + (bodyLines.length * 4.5) > pageHeight - 30) {
      const sliceCount = Math.floor((pageHeight - y - 35) / 4.5);
      pdf.text(bodyLines.slice(0, sliceCount), margin, y);
      pdf.addPage();
      y = margin;
      pdf.text(bodyLines.slice(sliceCount), margin, y);
      y += (bodyLines.length - sliceCount) * 4.5 + 10;
    } else {
      pdf.text(bodyLines, margin, y);
      y += bodyLines.length * 4.5 + 10;
    }
  }

  // Footer Note
  const footerY = pageHeight - 14;
  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
  pdf.setFontSize(7.5);
  pdf.setTextColor(148, 163, 184);
  pdf.text('Accounticca & E-Lawyers Chambers • Suite G-5, BTI Centara Grand, 144 Green Road, Panthapath, Dhaka-1205 • +880 1335-230170', margin, footerY);

  pdf.save(`${clientDoc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
}
