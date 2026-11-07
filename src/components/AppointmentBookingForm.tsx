import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Video, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone, 
  ArrowRight, 
  ShieldCheck, 
  Download, 
  ExternalLink, 
  Sparkles, 
  AlertCircle, 
  Copy, 
  Check, 
  Printer, 
  Briefcase,
  Scale,
  Calculator,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  Filter,
  Share2,
  FileText,
  BadgeCheck,
  Info,
  CheckCircle
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { generateConsultationChecklistPDF } from '../utils/consultationChecklistPdfGenerator';
import { getAccessToken } from '../services/workspaceAuth';
import { getStoredContactSheetId } from '../services/contactSheetsSync';
import { workspaceCalendarApi } from '../services/workspaceService';
import { ClientBookingDashboard } from './ClientBookingDashboard';
import { dispatchFormSubmissionToast } from './ui/FormSubmissionToast';
import {
  initiateUddoktaPayCheckout,
  verifyUddoktaPayPayment,
  savePendingUddoktaCheckout
} from '../services/uddoktapayService';
import { PatternFormat } from 'react-number-format';
import { useDebounce } from '../hooks/useDebounce';

export interface ExpertiseItem {
  id: string;
  name: string;
  description: string;
  badge?: string;
}

export interface PracticeAreaConfig {
  id: string;
  slug: string;
  aliases: string[];
  title: string;
  shortTitle: string;
  division: 'Accounticca Advisory' | 'E-Lawyers Chambers';
  category: 'Tax & VAT' | 'Corporate & Legal' | 'Finance & Assurance';
  icon: React.ComponentType<{ className?: string }>;
  badgeColor: string;
  accentBorder: string;
  tagline: string;
  description: string;
  leadPartner: {
    name: string;
    title: string;
    credentials: string;
    chamber: string;
    desk: string;
    sla: string;
  };
  expertiseAreas: ExpertiseItem[];
  preparationChecklist: string[];
  suggestedFee: string;
}

export interface AppointmentRecord {
  id: string;
  referenceId: string;
  practiceArea: string;
  practiceAreaId: string;
  expertiseArea: string;
  assignedPartner: {
    name: string;
    title: string;
    chamber: string;
    division: string;
  };
  mode: 'virtual' | 'in_person';
  date: string;
  timeSlot: string;
  clientName: string;
  email: string;
  phone: string;
  companyName: string;
  notes: string;
  consultationFee?: number;
  paymentStatus?: 'PAID' | 'PENDING';
  paymentGateway?: string;
  transactionId?: string;
  calendarEventId?: string;
  calendarSynced?: boolean;
  confirmationSent?: boolean;
  reminder3hSent?: boolean;
  createdAt: string;
}

export const PRACTICE_AREAS: PracticeAreaConfig[] = [
  {
    id: 'tax',
    slug: 'tax',
    aliases: ['tax', 'income-tax', 'income_tax', 'taxation', 'nbr', 'assessment', 'tax-return'],
    title: 'Income Tax Assessment & NBR Defense',
    shortTitle: 'Tax & NBR Defense',
    division: 'Accounticca Advisory',
    category: 'Tax & VAT',
    icon: Calculator,
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    accentBorder: 'border-emerald-600',
    tagline: 'Direct Taxation, Assessments & Taxes Appellate Tribunal',
    description: 'Corporate tax audits, TDS/VDS compliance, appeals & NBR tribunal notices under Income Tax Act 2023.',
    leadPartner: {
      name: 'Khandakar & Advisory Partners (Tax Bench)',
      title: 'Senior Income Tax Practitioner (ITP) & Chartered Tax Partner',
      credentials: 'Advocate Supreme Court | Dhaka Taxes Bar | ICAB FCA',
      chamber: 'Accounticca Direct Tax Wing • Chamber 4B, Panthapath & NBR Taxes Zone',
      desk: 'Direct Taxation & Appellate Litigation Desk',
      sla: 'Guaranteed matter assessment within 4 business hours'
    },
    expertiseAreas: [
      {
        id: 'tax-corp',
        name: 'Corporate Tax Assessment & Filing (Sec 73/75)',
        description: 'Allowable expense review, minimum tax optimization & statutory return submission.'
      },
      {
        id: 'tax-nbr',
        name: 'NBR Show-Cause, Penalty & Tax Audit Defense (Sec 180-182)',
        description: 'Chamber response drafting, documentary substantiation & tax officer hearings.'
      },
      {
        id: 'tax-appeal',
        name: 'Taxes Appellate Tribunal & High Court Reference',
        description: 'Formal memorandum of appeal, stay orders, dispute settlement & judicial review.'
      },
      {
        id: 'tax-tds',
        name: 'Withholding Tax (TDS) Compliance & Monthly Vetting',
        description: 'Source deduction rate verification, monthly challans, salary tax & refund claims.'
      },
      {
        id: 'tax-expat',
        name: 'Expatriate Taxation & Cross-Border Work Permits',
        description: 'DTAA relief, double taxation avoidance, BIDA tax clearance & expat salary filing.'
      },
      {
        id: 'tax-tp',
        name: 'Transfer Pricing Documentation & Certification',
        description: 'Arm’s length benchmarking, TP statements & multinational transfer pricing audits.'
      }
    ],
    preparationChecklist: [
      '12-digit e-TIN Certificate & Acknowledgement of last filed tax return',
      'Audited Financial Statements (P&L, Balance Sheet) or Trial Balance',
      'Copies of any NBR Notice, Demand Notice or Show-Cause received'
    ],
    suggestedFee: 'Executive Scoping Session • Standard Chamber Billing'
  },
  {
    id: 'vat',
    slug: 'vat',
    aliases: ['vat', 'mushak', 'customs', 'indirect-tax', 'vds', 'sd'],
    title: 'VAT & SD Act Compliance & Reconciliations',
    shortTitle: 'VAT & Customs',
    division: 'Accounticca Advisory',
    category: 'Tax & VAT',
    icon: FileSpreadsheet,
    badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
    accentBorder: 'border-teal-600',
    tagline: 'Mushak 9.1 Returns, Input Tax Rebates & Customs Disputes',
    description: 'Mushak 9.1 monthly returns, input tax rebate optimization, VAT audit risk mitigations under 2012 Act.',
    leadPartner: {
      name: 'Accredited VAT Advisory & Audit Group',
      title: 'Senior VAT Consultant (NBR Certified) & Cost Management Accountant',
      credentials: 'NBR Certified VAT Consultant | FCMA | Panthapath Chambers',
      chamber: 'Accounticca Indirect Tax Desk • Chamber 4B, Panthapath & VAT Commissionerate',
      desk: 'Indirect Tax & Customs Adjudication Desk',
      sla: 'Guaranteed return / rebate assessment within 4 business hours'
    },
    expertiseAreas: [
      {
        id: 'vat-mushak91',
        name: 'Mushak 9.1 Monthly VAT Return Audit & Submission',
        description: 'Sub-form reconciliation, debit/credit notes, automated portal submission & ledger checks.'
      },
      {
        id: 'vat-rebate',
        name: 'Input Tax Rebate (Mushak 4.3 Input-Output Declaration)',
        description: 'Maximizing rebate eligibility under Sec 46, coefficient formulation & NBR validation.'
      },
      {
        id: 'vat-audit',
        name: 'VAT Intelligence (NID) Inquiry & Commissionerate Audit',
        description: 'Audit risk defense, books of accounts inspection, reconciliation & penalty relief.'
      },
      {
        id: 'vat-vds',
        name: 'Withholding VAT (VDS) Deductions & Mushak 6.6',
        description: 'Source deduction rate confirmation, deposit compliance & monthly withholding reports.'
      },
      {
        id: 'vat-customs',
        name: 'Customs Duty, HS Code Classification & Bonded Warehouse',
        description: 'Import-export valuation, HS classification dispute resolution & bond audit clearances.'
      },
      {
        id: 'vat-appeal',
        name: 'VAT Appeal to Commissioner (Appeals) & CESTAT Tribunal',
        description: 'Challenging assessment orders, stay applications & appellate tribunal representation.'
      }
    ],
    preparationChecklist: [
      '13-digit Business Identification Number (BIN) Certificate',
      'Previous 3 Months Mushak 9.1 Returns with Treasury Challans',
      'Purchase/Sales Invoices (Mushak 6.3) & relevant input declaration (Mushak 4.3)'
    ],
    suggestedFee: 'Executive Scoping Session • Standard Chamber Billing'
  },
  {
    id: 'corporate_law',
    slug: 'corporate-law',
    aliases: ['corporate-law', 'corporate_law', 'corporate', 'litigation', 'commercial', 'legal', 'law'],
    title: 'Corporate Law & Commercial Litigation',
    shortTitle: 'Corporate Law',
    division: 'E-Lawyers Chambers',
    category: 'Corporate & Legal',
    icon: Scale,
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    accentBorder: 'border-blue-600',
    tagline: 'High Court Commercial Benches & Corporate Counsel',
    description: 'High Court commercial benches, company dispute mitigation, contract structuring & arbitration.',
    leadPartner: {
      name: 'Advocate Supreme Court & Commercial Benches Lead',
      title: 'Barrister-at-Law & Advocate Supreme Court of Bangladesh',
      credentials: 'Supreme Court Bar Association | Lincoln’s Inn / High Court Division',
      chamber: 'E-Lawyers Chambers • Suite G-5, BTI Centara Grand, Panthapath',
      desk: 'High Court Litigation & Commercial Chambers Desk',
      sla: 'Same-day urgent petition & dispute assessment available'
    },
    expertiseAreas: [
      {
        id: 'corp-lit',
        name: 'High Court Commercial Matters & Writ Petitions',
        description: 'Commercial injunctions, administrative writs & regulatory disputes against statutory bodies.'
      },
      {
        id: 'corp-shareholder',
        name: 'Shareholder Disputes, Board Deadlocks & Section 233',
        description: 'Minority shareholder protection, petition under Companies Act 1994, board restructuring.'
      },
      {
        id: 'corp-ma',
        name: 'Cross-Border M&A, Joint Ventures & Due Diligence',
        description: 'Share purchase agreements (SPA), regulatory clearances (BIDA/CCI), closing protocols.'
      },
      {
        id: 'corp-contracts',
        name: 'Commercial Contracts Drafting, Arbitration & Breach',
        description: 'High-stakes contract structuring, EPC/concession agreements, arbitration enforcement.'
      },
      {
        id: 'corp-labor',
        name: 'Employment Law, Executive Severance & Labour Act',
        description: 'Bangladesh Labour Act 2006 compliance, grievance handling & executive non-competes.'
      },
      {
        id: 'corp-ip',
        name: 'Intellectual Property Protection (Trademarks & Patents)',
        description: 'DPDT trademark registration, trademark infringement litigation, licensing contracts.'
      }
    ],
    preparationChecklist: [
      'Certified Copy of Memorandum & Articles of Association (MoA / AoA)',
      'Subject Agreement, Disputed Contract or Official Notices received',
      'Chronological factual brief or transaction summary of the current matter'
    ],
    suggestedFee: 'Senior Partner Consultation • Retainer or Session Billing'
  },
  {
    id: 'rjsc',
    slug: 'rjsc',
    aliases: ['rjsc', 'incorporation', 'company-registration', 'secretarial', 'company-reg'],
    title: 'RJSC Company Incorporation & Secretarial',
    shortTitle: 'RJSC Secretarial',
    division: 'E-Lawyers Chambers',
    category: 'Corporate & Legal',
    icon: Building2,
    badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    accentBorder: 'border-indigo-600',
    tagline: 'Entity Formation, Share Transfers & Regulatory Filings',
    description: 'Private/Public entity formation, share transfers, annual filings, BIDA clearance & returns.',
    leadPartner: {
      name: 'Chambers Registrar & Corporate Affairs Lead',
      title: 'Senior Corporate Secretarial Counsel & BIDA Licensing Specialist',
      credentials: 'Institute of Chartered Secretaries of Bangladesh (ICSB) & Advocate',
      chamber: 'E-Lawyers Corporate Affairs • Panthapath Chambers',
      desk: 'RJSC & Statutory Regulatory Filings Desk',
      sla: 'Name clearance & statutory document vetting within 2 hours'
    },
    expertiseAreas: [
      {
        id: 'rjsc-inc',
        name: 'Private / Public Limited Company Formation & MoA',
        description: 'Name clearance, digital RJSC portal setup, capital allocation, statutory certificates.'
      },
      {
        id: 'rjsc-bida',
        name: 'Foreign Liaison / Branch Office (BIDA Approval)',
        description: 'Inter-ministerial permission, 100% FDI registration, inward remittance account setup.'
      },
      {
        id: 'rjsc-transfer',
        name: 'Share Transfer, Capital Increase & Allotment (Form 117/6)',
        description: 'Stamp duty adjudication, board resolution, RJSC certified share transfer forms.'
      },
      {
        id: 'rjsc-filing',
        name: 'Annual Statutory Filings (Form XII, Schedule X, Returns)',
        description: 'Maintaining company status as ACTIVE, rectifying missed filings, AGM documentation.'
      },
      {
        id: 'rjsc-director',
        name: 'Director Appointment, Resignation & Board Reconstitution',
        description: 'Form IX / Form XII filings, managing director appointment approval, share qualification.'
      },
      {
        id: 'rjsc-winding',
        name: 'Voluntary Winding-Up & Striking-Off Procedure',
        description: 'Liquidator appointment, gazette notification, tax/VAT clearance & entity dissolution.'
      }
    ],
    preparationChecklist: [
      'Proposed Entity Name(s) and Primary Business Objectives',
      'NID / Passport copies & passport photos of all directors/shareholders',
      'Existing RJSC Registration Certificate & Form XII (for existing entities)'
    ],
    suggestedFee: 'Fixed Package / Retainer Secretarial Billing'
  },
  {
    id: 'audit',
    slug: 'audit',
    aliases: ['audit', 'statutory-audit', 'assurance', 'financial-audit', 'icab', 'forensic'],
    title: 'Statutory Financial Audit & Assurance',
    shortTitle: 'Audit & Assurance',
    division: 'Accounticca Advisory',
    category: 'Finance & Assurance',
    icon: Layers,
    badgeColor: 'bg-amber-50 text-amber-900 border-amber-200',
    accentBorder: 'border-amber-600',
    tagline: 'Chartered Accountants Audit & Regulatory Attestation',
    description: 'Chartered accountant statutory audits, BIDA certifications, ICAB standards & forensic reviews.',
    leadPartner: {
      name: 'Fellow Chartered Accountant (FCA) Assurance Partner',
      title: 'Partner - Assurance & Regulatory Compliance',
      credentials: 'Fellow Member of ICAB | Certified Forensic Auditor',
      chamber: 'Accounticca Audit Desk • Chamber 4A, Panthapath',
      desk: 'Audit, Assurance & Attestation Desk',
      sla: 'Audit scoping engagement delivered within 24 hours'
    },
    expertiseAreas: [
      {
        id: 'audit-annual',
        name: 'Statutory Annual Financial Statement Audit (ISA / BFRS)',
        description: 'Independent auditor report, ICAB DVC generation, compliance with Companies Act.'
      },
      {
        id: 'audit-special',
        name: 'Special Purpose Audit, Internal Controls & Management Letter',
        description: 'Internal control weakness evaluation, fraud prevention, management recommendations.'
      },
      {
        id: 'audit-bida',
        name: 'BIDA Inward Remittance Certification & Capital Verification',
        description: 'Foreign remittance audit report for Bangladesh Bank & BIDA capital verification.'
      },
      {
        id: 'audit-forensic',
        name: 'Forensic Accounting & Financial Discrepancy Investigation',
        description: 'Transaction tracing, inventory leakage audit, court-admissible financial evidence.'
      },
      {
        id: 'audit-fixed',
        name: 'Fixed Asset Impairment & Physical Inventory Verification',
        description: 'Year-end physical count supervision, valuation model verification & depreciation audit.'
      },
      {
        id: 'audit-opinion',
        name: 'Technical Accounting Opinions & GAAP / IFRS Advisory',
        description: 'Revenue recognition (IFRS 15), leases (IFRS 16), financial instruments compliance.'
      }
    ],
    preparationChecklist: [
      'Draft Financial Statements or Full Trial Balance for the audit period',
      'Bank statements for all accounts covering the financial year',
      'General Ledger, Sales/Purchase Registers & Fixed Asset Register'
    ],
    suggestedFee: 'Project-based Audit Scoping Assessment'
  },
  {
    id: 'cfo',
    slug: 'cfo',
    aliases: ['cfo', 'fractional-cfo', 'finance', 'corporate-finance', 'fundraising', 'valuation'],
    title: 'Fractional CFO & Corporate Finance',
    shortTitle: 'Fractional CFO',
    division: 'Accounticca Advisory',
    category: 'Finance & Assurance',
    icon: Briefcase,
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
    accentBorder: 'border-purple-600',
    tagline: 'Financial Forecasting, Fundraising & Strategic Modeling',
    description: 'Financial forecasting, fundraising advisory, cap table management, cash flow modeling & cloud ERP.',
    leadPartner: {
      name: 'Principal Corporate Finance & Strategy Advisor',
      title: 'Fellow Management Accountant (FCMA) & Venture Partner',
      credentials: 'FCMA | MBA in Corporate Finance | Startup Advisor',
      chamber: 'Accounticca Corporate Finance Desk • Chamber 4B, Panthapath',
      desk: 'Strategic Finance & Growth Advisory Desk',
      sla: 'Financial readiness & metric assessment within 4 hours'
    },
    expertiseAreas: [
      {
        id: 'cfo-model',
        name: 'Multi-Year Financial Modeling & Unit Economics Forecasting',
        description: 'Investor-ready pro-forma statements, cohort churn analysis, margin simulations.'
      },
      {
        id: 'cfo-fundraise',
        name: 'Startup Fundraising, Pitch Deck Preparation & Cap Table',
        description: 'Convertible notes, SAFE notes, valuation benchmarking, investor data room setup.'
      },
      {
        id: 'cfo-cashflow',
        name: 'Working Capital Optimization & 13-Week Cash Flow Runway',
        description: 'Accounts receivable acceleration, vendor renegotiation, burn rate governance.'
      },
      {
        id: 'cfo-erp',
        name: 'Enterprise Cloud ERP & Automated Accounting Architecture',
        description: 'QuickBooks / Xero / ERPNext migration, chart of accounts design, automated reconciliations.'
      },
      {
        id: 'cfo-margin',
        name: 'Cost Rationalization & Gross Margin Optimization',
        description: 'Overhead audits, product profitability analysis, tax-optimized cost structures.'
      },
      {
        id: 'cfo-ipo',
        name: 'Pre-IPO Corporate Restructuring & Enterprise Valuation',
        description: 'DCF valuation, comparative multiples, corporate governance readiness for public markets.'
      }
    ],
    preparationChecklist: [
      'Past 1-2 Years Profit & Loss (P&L) and Cash Flow Statements',
      'Current Cap Table / Shareholding structure (for fundraising matters)',
      'Brief deck, business plan, or primary growth / cost problem statement'
    ],
    suggestedFee: 'Executive Strategy Session • Retainer Scoping'
  }
];

const TIME_SLOTS = [
  { time: '10:00 AM - 10:45 AM BST', period: 'Morning' },
  { time: '11:30 AM - 12:15 PM BST', period: 'Morning' },
  { time: '02:30 PM - 03:15 PM BST', period: 'Afternoon' },
  { time: '03:45 PM - 04:30 PM BST', period: 'Afternoon' },
  { time: '05:00 PM - 05:45 PM BST', period: 'Evening' },
  { time: '06:15 PM - 07:00 PM BST', period: 'Evening' },
];

interface AppointmentBookingFormProps {
  initialPracticeArea?: string;
}

export function AppointmentBookingForm({ initialPracticeArea }: AppointmentBookingFormProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Helper to find practice area by string query/alias
  const resolvePracticeArea = (identifier?: string | null): PracticeAreaConfig => {
    if (!identifier) return PRACTICE_AREAS[0];
    const cleaned = identifier.toLowerCase().trim().replace(/[_\s]+/g, '-');
    const matched = PRACTICE_AREAS.find(p => 
      p.id.toLowerCase() === cleaned || 
      p.slug.toLowerCase() === cleaned || 
      p.aliases.some(a => a.toLowerCase() === cleaned) ||
      p.title.toLowerCase().includes(cleaned)
    );
    return matched || PRACTICE_AREAS[0];
  };

  // Determine initial practice from URL param or props
  const paramArea = searchParams.get('area') || searchParams.get('practice') || searchParams.get('service') || initialPracticeArea;
  const initialResolved = resolvePracticeArea(paramArea);

  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Core Practice Area State
  const [activePractice, setActivePractice] = useState<PracticeAreaConfig>(initialResolved);
  
  // Specific Area of Expertise State
  const [selectedExpertise, setSelectedExpertise] = useState<string>(() => {
    const queryExpertise = searchParams.get('expertise') || searchParams.get('topic');
    if (queryExpertise) {
      const match = initialResolved.expertiseAreas.find(e => 
        e.id === queryExpertise || e.name.toLowerCase().includes(queryExpertise.toLowerCase())
      );
      if (match) return match.name;
    }
    return initialResolved.expertiseAreas[0]?.name || '';
  });

  // Custom Expertise toggle
  const [isCustomExpertise, setIsCustomExpertise] = useState(false);
  const [customExpertiseText, setCustomExpertiseText] = useState('');

  // Mode: Virtual Google Meet vs In-Person Chamber
  const [consultationMode, setConsultationMode] = useState<'virtual' | 'in_person'>(() => {
    const modeParam = searchParams.get('mode');
    return modeParam === 'in_person' ? 'in_person' : 'virtual';
  });

  // Upcoming business dates
  const upcomingDates = useMemo(() => {
    const dates: { dateStr: string; displayDay: string; displayDate: string; isTomorrow?: boolean }[] = [];
    const today = new Date();
    
    let offset = 1;
    while (dates.length < 10) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + offset);
      // Skip Fridays (weekly court and corporate holiday in Bangladesh)
      const dayOfWeek = nextDate.getDay();
      if (dayOfWeek !== 5) {
        const iso = nextDate.toISOString().split('T')[0];
        const dayName = nextDate.toLocaleDateString('en-US', { weekday: 'short' });
        const monthDay = nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dates.push({
          dateStr: iso,
          displayDay: dayName,
          displayDate: monthDay,
          isTomorrow: offset === 1
        });
      }
      offset++;
    }
    return dates;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(upcomingDates[0]?.dateStr || '');
  const [selectedSlot, setSelectedSlot] = useState<string>(TIME_SLOTS[0].time);

  // Client Details with query param pre-fills
  const [clientName, setClientName] = useState(() => searchParams.get('name') || '');
  const [email, setEmail] = useState(() => searchParams.get('email') || '');
  const [phone, setPhone] = useState(() => searchParams.get('phone') || '');
  const [companyName, setCompanyName] = useState(() => searchParams.get('company') || '');
  const [notes, setNotes] = useState(() => searchParams.get('notes') || searchParams.get('message') || '');

  // Real-time Form Validation State
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formAttempted, setFormAttempted] = useState(false);

  const getFieldError = (name: string, value: string): string | null => {
    switch (name) {
      case 'clientName':
        if (!value.trim()) return 'Full name is required.';
        if (value.trim().length < 2) return 'Full name must be at least 2 characters.';
        return null;
      case 'email':
        if (!value.trim()) return 'Corporate email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Please enter a valid corporate email address.';
        return null;
      case 'phone': {
        const cleaned = value.replace(/_/g, '').trim();
        if (!cleaned) return 'Phone or WhatsApp number is required.';
        if (!/^[\d\+\-\s\(\)]{8,20}$/.test(cleaned)) return 'Please enter a valid phone number (at least 8 digits).';
        return null;
      }
      case 'companyName':
        if (value.trim() && value.trim().length < 2) return 'Company name must be at least 2 characters if provided.';
        return null;
      default:
        return null;
    }
  };

  const debouncedClientName = useDebounce(clientName, 300);
  const debouncedEmail = useDebounce(email, 300);
  const debouncedPhone = useDebounce(phone, 300);
  const debouncedCompanyName = useDebounce(companyName, 300);

  const validationErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    const nameErr = getFieldError('clientName', debouncedClientName);
    if (nameErr) errs.clientName = nameErr;

    const emailErr = getFieldError('email', debouncedEmail);
    if (emailErr) errs.email = emailErr;

    const phoneErr = getFieldError('phone', debouncedPhone);
    if (phoneErr) errs.phone = phoneErr;

    const compErr = getFieldError('companyName', debouncedCompanyName);
    if (compErr) errs.companyName = compErr;

    return errs;
  }, [debouncedClientName, debouncedEmail, debouncedPhone, debouncedCompanyName]);

  const handleBlurField = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSettlingRetainer, setIsSettlingRetainer] = useState(false);
  const [bookingSettlementMode, setBookingSettlementMode] = useState<'uddoktapay_instant' | 'uddoktapay_hosted' | 'pay_at_chamber'>('uddoktapay_instant');
  const [confirmedBooking, setConfirmedBooking] = useState<AppointmentRecord | null>(null);
  const [bookingSheetSynced, setBookingSheetSynced] = useState(false);
  const [calendarSynced, setCalendarSynced] = useState(false);
  const [confirmationDispatched, setConfirmationDispatched] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const consultationFeeAmount = useMemo(() => {
    const digits = activePractice.suggestedFee.replace(/[^0-9]/g, '');
    const parsed = digits ? parseInt(digits, 10) : 0;
    return parsed >= 500 ? parsed : 3500;
  }, [activePractice]);

  // Sync URL when practice changes (or when arriving via direct URL)
  useEffect(() => {
    const urlArea = searchParams.get('area') || searchParams.get('practice') || searchParams.get('service');
    if (urlArea) {
      const resolved = resolvePracticeArea(urlArea);
      if (resolved.id !== activePractice.id) {
        setActivePractice(resolved);
        setSelectedExpertise(resolved.expertiseAreas[0]?.name || '');
      }
    }
  }, [searchParams]);

  // Handle Practice Area switch & dynamic routing
  const handleSelectPractice = (practice: PracticeAreaConfig) => {
    setActivePractice(practice);
    setIsCustomExpertise(false);
    setCustomExpertiseText('');
    setSelectedExpertise(practice.expertiseAreas[0]?.name || '');

    // Synchronize URL query parameter smoothly without page reload
    setSearchParams(prev => {
      const updated = new URLSearchParams(prev);
      updated.set('tab', 'appointment');
      updated.set('area', practice.slug);
      return updated;
    }, { replace: true });
  };

  // Local storage recent appointments
  const [recentAppointments, setRecentAppointments] = useState<AppointmentRecord[]>(() => {
    try {
      const stored = localStorage.getItem('accounticca_booked_appointments');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleCopyRef = (refId: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(refId);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handleCopyShareableLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      const shareUrl = `${window.location.origin}/contact?tab=appointment&area=${activePractice.slug}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2200);
    }
  };

  const handleSettleConfirmedBookingViaUddoktaPay = async (booking: AppointmentRecord, mode: 'hosted' | 'instant') => {
    setIsSettlingRetainer(true);
    try {
      const fee = booking.consultationFee || consultationFeeAmount;
      const metadata = {
        invoice_id: booking.referenceId,
        appointment_id: booking.referenceId,
        flow_type: 'consultation_booking',
        practiceArea: booking.practiceArea,
        expertiseArea: booking.expertiseArea,
        date: booking.date,
        timeSlot: booking.timeSlot,
        customer_name: booking.clientName,
        customer_email: booking.email,
        phone: booking.phone
      };

      const initRes = await initiateUddoktaPayCheckout({
        fullName: booking.clientName,
        email: booking.email,
        amount: fee.toFixed(2),
        currency: 'BDT',
        metadata,
        redirectUrl: `${window.location.origin}/extensions/uddoktapay/success`,
        cancelUrl: `${window.location.origin}/gateway/uddoktapay/cancel`
      });

      if (initRes.status) {
        const gatewayInvoiceId = initRes.invoice_id || booking.referenceId;
        savePendingUddoktaCheckout({
          invoiceId: gatewayInvoiceId,
          sessionId: booking.referenceId,
          flowType: 'consultation_booking',
          fullName: booking.clientName,
          email: booking.email,
          phone: booking.phone,
          companyName: booking.companyName,
          amount: fee,
          currency: 'BDT',
          metadata,
          createdAt: new Date().toISOString()
        });

        if (mode === 'hosted' && initRes.payment_url && !initRes.payment_url.includes('/payment/verify')) {
          window.location.href = initRes.payment_url;
          return;
        }

        const verified = await verifyUddoktaPayPayment(gatewayInvoiceId);
        const trxId = verified.transaction_id || `UPAY-${gatewayInvoiceId.slice(-8).toUpperCase()}`;
        const updatedBooking: AppointmentRecord = {
          ...booking,
          consultationFee: fee,
          paymentStatus: 'PAID',
          paymentGateway: `UddoktaPay (${verified.payment_method || 'bKash'})`,
          transactionId: trxId
        };
        setConfirmedBooking(updatedBooking);
        const updatedList = [
          updatedBooking,
          ...recentAppointments.filter((a) => a.referenceId !== booking.referenceId)
        ];
        setRecentAppointments(updatedList);
        localStorage.setItem('accounticca_booked_appointments', JSON.stringify(updatedList));
        window.dispatchEvent(new CustomEvent('accounticca:appointment-updated'));

        dispatchFormSubmissionToast({
          title: 'Consultation Retainer Paid via UddoktaPay!',
          position: `${booking.practiceArea} · BDT ${fee.toLocaleString('en-IN')}`,
          message: `Verified via UddoktaPay. TrxID: ${trxId}`,
          referenceId: booking.referenceId,
          recipientEmail: booking.email,
          type: 'success'
        });
      }
    } finally {
      setIsSettlingRetainer(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormAttempted(true);
    setTouched({ clientName: true, email: true, phone: true, companyName: true });

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    const refNumber = Math.floor(10000 + Math.random() * 90000);
    const referenceId = `APT-2026-${refNumber}`;

    const effectiveExpertise = isCustomExpertise 
      ? (customExpertiseText.trim() || 'Custom Advisory Request') 
      : selectedExpertise;

    let paymentStatus: 'PAID' | 'PENDING' = 'PENDING';
    let paymentGateway = 'Chamber Desk / Pending';
    let verifiedTrxId = '';
    let redirectAfterSaveUrl: string | null = null;

    if (bookingSettlementMode !== 'pay_at_chamber') {
      const metadata = {
        invoice_id: referenceId,
        appointment_id: referenceId,
        flow_type: 'consultation_booking',
        practiceArea: activePractice.title,
        expertiseArea: effectiveExpertise,
        date: selectedDate,
        timeSlot: selectedSlot,
        customer_name: clientName.trim(),
        customer_email: email.trim(),
        phone: phone.trim()
      };

      const initRes = await initiateUddoktaPayCheckout({
        fullName: clientName.trim(),
        email: email.trim(),
        amount: consultationFeeAmount.toFixed(2),
        currency: 'BDT',
        metadata,
        redirectUrl: `${window.location.origin}/extensions/uddoktapay/success`,
        cancelUrl: `${window.location.origin}/gateway/uddoktapay/cancel`
      });

      if (initRes.status) {
        const gatewayInvoiceId = initRes.invoice_id || referenceId;
        savePendingUddoktaCheckout({
          invoiceId: gatewayInvoiceId,
          sessionId: referenceId,
          flowType: 'consultation_booking',
          fullName: clientName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          companyName: companyName.trim() || 'Direct Client / Confidential',
          amount: consultationFeeAmount,
          currency: 'BDT',
          metadata,
          createdAt: new Date().toISOString()
        });

        if (
          bookingSettlementMode === 'uddoktapay_hosted' &&
          initRes.payment_url &&
          !initRes.payment_url.includes('/payment/verify')
        ) {
          redirectAfterSaveUrl = initRes.payment_url;
        } else {
          const verified = await verifyUddoktaPayPayment(gatewayInvoiceId);
          verifiedTrxId = verified.transaction_id || `UPAY-${gatewayInvoiceId.slice(-8).toUpperCase()}`;
          paymentStatus = 'PAID';
          paymentGateway = `UddoktaPay (${verified.payment_method || 'bKash'})`;
        }
      }
    }

    const newAppointment: AppointmentRecord = {
      id: `apt_${Date.now()}`,
      referenceId,
      practiceArea: activePractice.title,
      practiceAreaId: activePractice.id,
      expertiseArea: effectiveExpertise,
      assignedPartner: {
        name: activePractice.leadPartner.name,
        title: activePractice.leadPartner.title,
        chamber: activePractice.leadPartner.chamber,
        division: activePractice.division
      },
      mode: consultationMode,
      date: selectedDate,
      timeSlot: selectedSlot,
      clientName: clientName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      companyName: companyName.trim() || 'Direct Client / Confidential',
      notes: notes.trim(),
      consultationFee: consultationFeeAmount,
      paymentStatus,
      paymentGateway,
      transactionId: verifiedTrxId || undefined,
      createdAt: new Date().toISOString()
    };

    // 1. Automatic Workspace Google Calendar Synchronization (Standard Event)
    let calendarEventId: string | undefined = undefined;
    let calendarSyncedSuccess = false;

    try {
      const workspaceAccessToken = getAccessToken();
      if (workspaceAccessToken) {
        const startHourMatch = newAppointment.timeSlot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        let startHour = 10;
        let startMin = 0;
        if (startHourMatch) {
          startHour = parseInt(startHourMatch[1], 10);
          startMin = parseInt(startHourMatch[2], 10);
          const meridian = startHourMatch[3] ? startHourMatch[3].toUpperCase() : '';
          if (meridian === 'PM' && startHour < 12) startHour += 12;
          if (meridian === 'AM' && startHour === 12) startHour = 0;
        }

        const [year, month, day] = newAppointment.date.split('-').map(Number);
        // Bangladesh Standard Time (UTC+6)
        const startDate = new Date(Date.UTC(year, month - 1, day, startHour - 6, startMin));
        const endDate = new Date(startDate.getTime() + 45 * 60 * 1000);

        const summary = `[Legal Consultation] ${newAppointment.practiceArea} - ${newAppointment.clientName}`;
        const description = [
          `Docket Reference: ${newAppointment.referenceId}`,
          `Client: ${newAppointment.clientName} (${newAppointment.companyName})`,
          `Client Contact: ${newAppointment.email} | ${newAppointment.phone}`,
          `Practice Focus: ${newAppointment.practiceArea}`,
          `Specialized Expertise: ${newAppointment.expertiseArea}`,
          `Assigned Counsel: ${newAppointment.assignedPartner.name} (${newAppointment.assignedPartner.chamber})`,
          `Consultation Format: ${newAppointment.mode === 'virtual' ? 'Virtual Consultation (Google Workspace Scheduled)' : 'In-Person Chamber Suite (Panthapath, Dhaka)'}`,
          `Retainer Settlement: ${newAppointment.paymentStatus === 'PAID' ? `PAID via ${newAppointment.paymentGateway} (TrxID: ${newAppointment.transactionId})` : 'Pending Chamber Settlement'}`,
          `Client Agenda / Matter Notes: ${newAppointment.notes || 'General Legal & Tax Scoping Consultation'}`,
          `\nProvider Notice: Both Lead Partner and Central Firm Desk (ekram@elawyersbd.com) copied.`
        ].join('\n');

        const location = newAppointment.mode === 'virtual'
          ? 'Virtual Consultation (Google Workspace Scheduled)'
          : 'Suite G-5, BTI Centara Grand, 144 Green Road, Panthapath, Dhaka-1205';

        const calRes = await workspaceCalendarApi.createEvent({
          summary,
          description,
          location,
          start: { dateTime: startDate.toISOString() },
          end: { dateTime: endDate.toISOString() }
        });

        if (calRes && calRes.id) {
          calendarEventId = calRes.id;
          calendarSyncedSuccess = true;
          newAppointment.calendarEventId = calRes.id;
          newAppointment.calendarSynced = true;
        }
      }
    } catch (calErr) {
      console.warn('[Workspace Calendar Sync Notice]', calErr);
    }
    setCalendarSynced(calendarSyncedSuccess);

    // 2. Save to Firestore 'appointments'
    let firestoreDocId: string | undefined = undefined;
    try {
      const appointmentCollection = collection(db, 'appointments');
      const docRef = await addDoc(appointmentCollection, {
        referenceId: newAppointment.referenceId,
        practiceArea: newAppointment.practiceArea,
        practiceAreaId: newAppointment.practiceAreaId,
        expertiseArea: newAppointment.expertiseArea,
        assignedPartner: newAppointment.assignedPartner,
        division: activePractice.division,
        mode: newAppointment.mode,
        date: newAppointment.date,
        timeSlot: newAppointment.timeSlot,
        clientName: newAppointment.clientName,
        email: newAppointment.email,
        phone: newAppointment.phone,
        companyName: newAppointment.companyName,
        notes: newAppointment.notes,
        consultationFee: newAppointment.consultationFee,
        paymentStatus: newAppointment.paymentStatus,
        paymentGateway: newAppointment.paymentGateway,
        transactionId: newAppointment.transactionId || null,
        userId: auth.currentUser?.uid || null,
        userEmail: auth.currentUser?.email || newAppointment.email,
        status: 'confirmed',
        calendarEventId: calendarEventId || null,
        calendarSynced: calendarSyncedSuccess,
        reminder3hSent: false,
        createdAt: serverTimestamp(),
      });
      firestoreDocId = docRef.id;
    } catch (err) {
      console.warn('Note: Stored locally as offline backup or Firestore check:', err);
    }

    // 3. Automated Instant Confirmation Email to Client & Providers (Lead Partner + ekram@elawyersbd.com)
    let emailDispatched = false;
    try {
      const notifyRes = await fetch('/api/appointments/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceId: newAppointment.referenceId,
          appointmentId: firestoreDocId,
          clientName: newAppointment.clientName,
          email: newAppointment.email,
          phone: newAppointment.phone,
          companyName: newAppointment.companyName,
          practiceArea: newAppointment.practiceArea,
          mode: newAppointment.mode,
          date: newAppointment.date,
          timeSlot: newAppointment.timeSlot,
          status: newAppointment.paymentStatus === 'PAID' ? `Confirmed & Paid (${newAppointment.transactionId})` : 'Confirmed',
          leadPartnerName: newAppointment.assignedPartner.name,
          leadPartnerEmail: 'ekram@elawyersbd.com',
          calendarEventId
        })
      });
      if (notifyRes.ok) {
        emailDispatched = true;
        newAppointment.confirmationSent = true;
      }
    } catch (notifyErr) {
      console.warn('[Appointment Email Notification Notice]', notifyErr);
    }
    setConfirmationDispatched(emailDispatched);

    // 4. Save to Backend Contact & Meetings Ledger + Real-Time Google Sheets Auto-Append
    let syncedToSheet = false;
    try {
      const workspaceAccessToken = getAccessToken();
      const spreadsheetId = getStoredContactSheetId();
      const submitRes = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceId: newAppointment.referenceId,
          requestType: 'Consultation Meeting',
          division: activePractice.division,
          clientName: newAppointment.clientName,
          email: newAppointment.email,
          phone: newAppointment.phone,
          companyName: newAppointment.companyName,
          serviceArea: newAppointment.practiceArea,
          expertiseTopic: newAppointment.expertiseArea,
          consultationMode:
            newAppointment.mode === 'virtual'
              ? 'Virtual Consultation (Google Workspace Scheduled)'
              : 'In-Person Chamber (Dhaka)',
          preferredDate: newAppointment.date,
          preferredTimeSlot: newAppointment.timeSlot,
          assignedPartner: `${newAppointment.assignedPartner.name} (${newAppointment.assignedPartner.chamber})`,
          messageOrNotes: newAppointment.notes || 'Scheduled Consultation Session',
          status: newAppointment.paymentStatus === 'PAID' ? `Confirmed & Paid (${newAppointment.transactionId})` : 'Confirmed Booking',
          workspaceAccessToken: workspaceAccessToken || undefined,
          spreadsheetId: spreadsheetId || undefined,
          calendarEventId,
          leadPartnerEmail: 'ekram@elawyersbd.com'
        }),
      });
      if (submitRes.ok) {
        const submitData = await submitRes.json();
        syncedToSheet = Boolean(submitData.sheetSynced);
      }
    } catch (syncErr) {
      console.warn('Contact & Meetings sheet ledger sync notice:', syncErr);
    }

    // 5. Save locally for instant verification & session recall
    try {
      const enrichedBooking = {
        ...newAppointment,
        id: firestoreDocId || newAppointment.referenceId,
      };
      const updated = [enrichedBooking, ...recentAppointments.filter((a) => a.referenceId !== newAppointment.referenceId)];
      setRecentAppointments(updated);
      localStorage.setItem('accounticca_booked_appointments', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('accounticca:appointment-updated'));
    } catch {
      // safe fallback
    }

    if (redirectAfterSaveUrl) {
      window.location.href = redirectAfterSaveUrl;
      return;
    }

    setBookingSheetSynced(syncedToSheet);
    setConfirmedBooking(newAppointment);
    setIsSubmitting(false);

    dispatchFormSubmissionToast({
      title: newAppointment.paymentStatus === 'PAID'
        ? 'Consultation Confirmed & Retainer Paid!'
        : 'Consultation Appointment Confirmed!',
      position: `${newAppointment.practiceArea} · ${newAppointment.date} (${newAppointment.timeSlot})`,
      message: newAppointment.paymentStatus === 'PAID'
        ? `Session with ${newAppointment.assignedPartner.name} confirmed. UddoktaPay TrxID: ${newAppointment.transactionId}`
        : `Your session with ${newAppointment.assignedPartner.name} has been scheduled.`,
      referenceId: newAppointment.referenceId,
      recipientEmail: newAppointment.email,
      type: 'success',
    });
  };

  // Helper to generate Google Calendar Link
  const getGoogleCalendarUrl = (booking: AppointmentRecord) => {
    const startHourMatch = booking.timeSlot.match(/^(\d{2}):(\d{2})\s*(AM|PM)/);
    let startHour = 10;
    let startMin = 0;
    if (startHourMatch) {
      startHour = parseInt(startHourMatch[1], 10);
      startMin = parseInt(startHourMatch[2], 10);
      if (startHourMatch[3] === 'PM' && startHour < 12) startHour += 12;
      if (startHourMatch[3] === 'AM' && startHour === 12) startHour = 0;
    }

    // BST is UTC+6
    const [year, month, day] = booking.date.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, day, startHour - 6, startMin));
    const endDate = new Date(startDate.getTime() + 45 * 60 * 1000);

    const formatGCalDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const datesParam = `${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`;

    const title = encodeURIComponent(`Consultation: ${booking.expertiseArea || booking.practiceArea} (${booking.assignedPartner?.division || 'Accounticca × E-Lawyers'})`);
    const details = encodeURIComponent(
      `Appointment Ref: ${booking.referenceId}\nClient: ${booking.clientName} (${booking.companyName})\nPractice Area: ${booking.practiceArea}\nSpecialized Expertise: ${booking.expertiseArea}\nAssigned Chamber Lead: ${booking.assignedPartner?.name} (${booking.assignedPartner?.title})\nFormat: ${booking.mode === 'virtual' ? 'Google Meet Video Call' : 'Chamber Consultation'}\nClient Agenda: ${booking.notes || 'General Scoping'}\n\nChamber Phone: +880 1335-230170\nPanthapath Chambers, Dhaka, Bangladesh.`
    );
    const location = encodeURIComponent(
      booking.mode === 'virtual' 
        ? 'Google Meet (Link will be activated 10m before session)' 
        : 'Suite G-5, BTI Centara Grand, 144 Green Road, Panthapath, Dhaka-1205'
    );

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datesParam}&details=${details}&location=${location}`;
  };

  // Helper to trigger .ics download
  const downloadIcsFile = (booking: AppointmentRecord) => {
    const startHourMatch = booking.timeSlot.match(/^(\d{2}):(\d{2})\s*(AM|PM)/);
    let startHour = 10;
    let startMin = 0;
    if (startHourMatch) {
      startHour = parseInt(startHourMatch[1], 10);
      startMin = parseInt(startHourMatch[2], 10);
      if (startHourMatch[3] === 'PM' && startHour < 12) startHour += 12;
      if (startHourMatch[3] === 'AM' && startHour === 12) startHour = 0;
    }

    const [year, month, day] = booking.date.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, day, startHour - 6, startMin));
    const endDate = new Date(startDate.getTime() + 45 * 60 * 1000);

    const pad = (n: number) => (n < 10 ? '0' + n : n);
    const formatIcs = (d: Date) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

    const locationText = booking.mode === 'virtual' 
      ? 'Google Meet Video Conference'
      : 'Suite G-5, BTI Centara Grand, 144 Green Road, Panthapath, Dhaka';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Accounticca and E-Lawyers//Consultation Appointment//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${booking.referenceId}@accounticca.com`,
      `DTSTAMP:${formatIcs(new Date())}`,
      `DTSTART:${formatIcs(startDate)}`,
      `DTEND:${formatIcs(endDate)}`,
      `SUMMARY:Executive Consultation: ${booking.expertiseArea || booking.practiceArea}`,
      `DESCRIPTION:Consultation with ${booking.assignedPartner?.name} (${booking.assignedPartner?.division}).\\nRef: ${booking.referenceId}\\nClient: ${booking.clientName}\\nEntity: ${booking.companyName}\\nPractice: ${booking.practiceArea}\\nExpertise: ${booking.expertiseArea}\\nAgenda: ${booking.notes || 'General Advisory'}\\nPhone: +880 1335-230170`,
      `LOCATION:${locationText}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${booking.referenceId}-Consultation.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter practice areas by selected category
  const filteredPractices = useMemo(() => {
    if (selectedCategory === 'All') return PRACTICE_AREAS;
    return PRACTICE_AREAS.filter(p => p.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm relative">
      {/* Top Header Badge */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span>Book Consultation Appointment</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyShareableLink}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3 py-1 rounded-full border border-slate-200 hover:border-emerald-200 transition-colors cursor-pointer"
            title="Copy direct link to this practice area"
          >
            {copiedShareLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedShareLink ? 'Link Copied!' : 'Share Practice Link'}</span>
          </button>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            Live Slot Scheduling (BST)
          </span>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
        Select your required practice area, pinpoint the exact area of expertise needed, and choose your preferred date and format. Our dynamic chamber routing assigns your matter directly to the senior partner in charge of that legal or financial domain.
      </p>

      {/* Confirmation View */}
      {confirmedBooking ? (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-8 rounded-3xl bg-gradient-to-b from-emerald-50/80 to-teal-50/40 border-2 border-emerald-300 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-mono text-xs font-bold mb-2">
                <span>REF: {confirmedBooking.referenceId}</span>
                <button
                  type="button"
                  onClick={() => handleCopyRef(confirmedBooking.referenceId)}
                  className="hover:text-emerald-950 transition-colors"
                  title="Copy Reference ID"
                >
                  {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <h3 className="text-2xl font-black text-slate-900">Appointment Confirmed &amp; Routed!</h3>
              <p className="text-sm text-slate-600 max-w-lg mx-auto mt-1 leading-relaxed">
                Thank you, <strong>{confirmedBooking.clientName}</strong>. Your matter has been routed directly to the specialized desk lead.
              </p>
            </div>

            {/* Summary Details Box */}
            <div className="bg-white p-5 rounded-2xl border border-emerald-200/90 text-left max-w-xl mx-auto shadow-xs space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Practice Area</span>
                  <span className="font-bold text-slate-900">{confirmedBooking.practiceArea}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Chamber Routing</span>
                  <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{confirmedBooking.assignedPartner.division}</span>
                  </span>
                </div>
                <div className="sm:col-span-2 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200">
                  <span className="text-emerald-900 font-bold uppercase tracking-wider block text-[10px]">Specialized Expertise Area</span>
                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{confirmedBooking.expertiseArea}</span>
                  <span className="block text-[11px] text-slate-600 mt-0.5">Assigned Lead: {confirmedBooking.assignedPartner.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Consultation Mode</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    {confirmedBooking.mode === 'virtual' ? (
                      <>
                        <Video className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Virtual (Google Meet)</span>
                      </>
                    ) : (
                      <>
                        <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>In-Person Chamber (Dhaka)</span>
                      </>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Date &amp; Time Window</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{confirmedBooking.date} • {confirmedBooking.timeSlot.split(' ')[0]} {confirmedBooking.timeSlot.split(' ')[1]}</span>
                  </span>
                </div>
                <div className="sm:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px]">Consultation Retainer &amp; UddoktaPay Status</span>
                    <div className="font-mono font-extrabold text-slate-900 text-xs mt-0.5">
                      BDT {(confirmedBooking.consultationFee || consultationFeeAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      {' · '}
                      {confirmedBooking.paymentStatus === 'PAID' ? (
                        <span className="text-emerald-700">
                          PAID via {confirmedBooking.paymentGateway || 'UddoktaPay'} (TrxID: {confirmedBooking.transactionId})
                        </span>
                      ) : (
                        <span className="text-amber-700">Retainer Pending Settlement</span>
                      )}
                    </div>
                  </div>
                  {confirmedBooking.paymentStatus !== 'PAID' && (
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isSettlingRetainer}
                        onClick={() => handleSettleConfirmedBookingViaUddoktaPay(confirmedBooking, 'hosted')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isSettlingRetainer ? 'Connecting...' : 'Pay via UddoktaPay'}
                      </button>
                      <button
                        type="button"
                        disabled={isSettlingRetainer}
                        onClick={() => handleSettleConfirmedBookingViaUddoktaPay(confirmedBooking, 'instant')}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Instant Verify
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-800">
                    <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      Confirmation Sent: <strong>{confirmedBooking.email}</strong> (Copy to Lead Partner &amp; ekram@elawyersbd.com)
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{calendarSynced || confirmedBooking.calendarSynced ? 'Synced to /workspace Calendar' : 'Workspace Calendar Ready'}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-500 pt-1">
                  <span className="inline-flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Automated Reminder: Scheduled <strong>3 hours</strong> before session start</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-mono text-slate-600">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                    <span>{bookingSheetSynced ? 'Auto-appended to Google Sheets' : 'Recorded in Firm Ledger'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Collapsible Document Preparation Checklist Box */}
            <div className="bg-white p-6 rounded-2xl border border-emerald-200/90 text-left max-w-xl mx-auto shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <h4 className="text-sm font-black text-slate-900">
                    Required Preparation Checklist ({activePractice.shortTitle})
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => generateConsultationChecklistPDF(confirmedBooking, activePractice.preparationChecklist)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
                  title="Download PDF Preparation Checklist"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Checklist PDF</span>
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                To maximize the productivity of your 45-minute consultation with <strong>{confirmedBooking.assignedPartner?.name || activePractice.leadPartner.name}</strong>, please have the following records available:
              </p>

              <ul className="space-y-2 pt-1">
                {activePractice.preparationChecklist.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-snug font-medium">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>You can also upload these files directly in your Client Portal prior to the session.</span>
              </div>
            </div>

            {/* Calendar & Export Actions */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <a
                href={getGoogleCalendarUrl(confirmedBooking)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
              >
                <Calendar className="w-4 h-4" />
                <span>Add to Google Calendar</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <button
                type="button"
                onClick={() => downloadIcsFile(confirmedBooking)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Download .ics Invitation</span>
              </button>

              <Link
                to="/profile?tab=appointments"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-emerald-700" />
                <span>Track in My Appointments</span>
              </Link>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
            </div>

            {/* Re-book Option */}
            <div className="pt-4">
              <button
                type="button"
                onClick={() => setConfirmedBooking(null)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
              >
                ← Schedule Another Consultation Session
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleBookAppointment} className="space-y-8">
          {/* 1. Practice Area Selection (Dropdown) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="booking-practice-area"
                className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center">
                  1
                </span>
                <span>Select Practice Area &amp; Topic *</span>
              </label>
              <span className="text-[11px] font-semibold text-emerald-800">
                {activePractice.division}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="booking-practice-area"
                  className="block text-xs font-semibold text-slate-600 mb-1.5"
                >
                  Practice Area *
                </label>
                <select
                  id="booking-practice-area"
                  value={activePractice.id}
                  onChange={(e) => {
                    const found = PRACTICE_AREAS.find((p) => p.id === e.target.value);
                    if (found) handleSelectPractice(found);
                  }}
                  className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all cursor-pointer"
                >
                  {PRACTICE_AREAS.map((practice) => (
                    <option key={practice.id} value={practice.id}>
                      {practice.title} ({practice.division})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="booking-expertise-topic"
                  className="block text-xs font-semibold text-slate-600 mb-1.5"
                >
                  Specific Advisory Topic *
                </label>
                <select
                  id="booking-expertise-topic"
                  value={isCustomExpertise ? '__custom__' : selectedExpertise}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomExpertise(true);
                    } else {
                      setIsCustomExpertise(false);
                      setSelectedExpertise(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all cursor-pointer"
                >
                  {activePractice.expertiseAreas.map((exp) => (
                    <option key={exp.id} value={exp.name}>
                      {exp.name}
                    </option>
                  ))}
                  <option value="__custom__">+ Custom / Hybrid Multi-Practice Topic</option>
                </select>
              </div>
            </div>

            {isCustomExpertise && (
              <div className="pt-1">
                <input
                  type="text"
                  value={customExpertiseText}
                  onChange={(e) => setCustomExpertiseText(e.target.value)}
                  placeholder="Specify your custom legal, tax, or financial matter..."
                  className="w-full bg-slate-50 border border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            )}

            <p className="text-xs text-slate-500">
              Assigned Desk: <strong className="text-slate-800">{activePractice.leadPartner.name}</strong> ({activePractice.leadPartner.chamber})
            </p>
          </div>

          {/* 2. Consultation Mode (Virtual Google Meet vs Chamber In-Person) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center">2</span>
                <span>Select Consultation Mode *</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Virtual (Google Meet) */}
              <button
                type="button"
                onClick={() => setConsultationMode('virtual')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 relative ${
                  consultationMode === 'virtual'
                    ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  consultationMode === 'virtual' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-slate-900">Virtual (Google Meet)</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                      Popular
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Direct video conference with screen-sharing for doc review, financial model scrutiny, and instant legal assessments.
                  </p>
                </div>
                {consultationMode === 'virtual' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute top-4 right-4" />
                )}
              </button>

              {/* In-Person Chamber (Dhaka) */}
              <button
                type="button"
                onClick={() => setConsultationMode('in_person')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 relative ${
                  consultationMode === 'in_person'
                    ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  consultationMode === 'in_person' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-slate-900">In-Person Chamber</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      Panthapath
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Executive Chambers at Suite G-5, BTI Centara Grand, 144 Green Road, Panthapath, Dhaka-1205.
                  </p>
                </div>
                {consultationMode === 'in_person' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute top-4 right-4" />
                )}
              </button>
            </div>
          </div>

          {/* 3. Date & Time Slot Picker (Dropdown) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label
                htmlFor="booking-date-select"
                className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center">
                  3
                </span>
                <span>Select Date &amp; Time Slot (BST) *</span>
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                Bangladesh Standard Time (UTC+6)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="booking-date-select"
                  className="block text-xs font-semibold text-slate-600 mb-1.5"
                >
                  Preferred Chamber Date *
                </label>
                <select
                  id="booking-date-select"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all cursor-pointer"
                >
                  {upcomingDates.map((d) => (
                    <option key={d.dateStr} value={d.dateStr}>
                      {d.displayDay}, {d.displayDate} ({d.dateStr}){d.isTomorrow ? ' — Tomorrow' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="booking-slot-select"
                  className="block text-xs font-semibold text-slate-600 mb-1.5"
                >
                  45-Minute Consultation Window *
                </label>
                <select
                  id="booking-slot-select"
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all cursor-pointer"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot.time} value={slot.time}>
                      {slot.time} ({slot.period})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 4. Client & Matter Details */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center">4</span>
                <span>Client &amp; Entity Information *</span>
              </label>
              <span className="text-[11px] text-slate-500">Confidentiality guaranteed</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="booking-client-name" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Full Name *
                  </label>
                  {touched.clientName && !validationErrors.clientName && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                    </span>
                  )}
                </div>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    name="name"
                    id="booking-client-name"
                    autoComplete="name"
                    inputMode="text"
                    value={clientName}
                    onChange={(e) => {
                      setClientName(e.target.value);
                      if (!touched.clientName) setTouched(prev => ({ ...prev, clientName: true }));
                    }}
                    onBlur={() => handleBlurField('clientName')}
                    placeholder="e.g. Mahfuzur Rahman"
                    className={`w-full bg-slate-50 border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all text-slate-900 ${
                      (touched.clientName || formAttempted) && validationErrors.clientName
                        ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/30 bg-rose-50/20'
                        : touched.clientName && !validationErrors.clientName
                        ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 bg-emerald-50/10'
                        : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'
                    }`}
                  />
                </div>
                {(touched.clientName || formAttempted) && validationErrors.clientName && (
                  <p className="mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{validationErrors.clientName}</span>
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="booking-client-email" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Corporate Email *
                  </label>
                  {touched.email && !validationErrors.email && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    name="email"
                    id="booking-client-email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (!touched.email) setTouched(prev => ({ ...prev, email: true }));
                    }}
                    onBlur={() => handleBlurField('email')}
                    placeholder="name@company.com"
                    className={`w-full bg-slate-50 border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all text-slate-900 ${
                      (touched.email || formAttempted) && validationErrors.email
                        ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/30 bg-rose-50/20'
                        : touched.email && !validationErrors.email
                        ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 bg-emerald-50/10'
                        : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'
                    }`}
                  />
                </div>
                {(touched.email || formAttempted) && validationErrors.email && (
                  <p className="mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{validationErrors.email}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="booking-client-phone" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Phone / WhatsApp *
                  </label>
                  {touched.phone && !validationErrors.phone && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <PatternFormat
                    type="tel"
                    name="tel"
                    id="booking-client-phone"
                    autoComplete="tel"
                    inputMode="tel"
                    format={phone.trim().startsWith('+') ? '+### ####-######' : '#####-######'}
                    mask="_"
                    value={phone}
                    onValueChange={(values) => {
                      setPhone(values.formattedValue);
                      if (!touched.phone) setTouched(prev => ({ ...prev, phone: true }));
                    }}
                    onBlur={() => handleBlurField('phone')}
                    placeholder="01712-XXXXXX"
                    className={`w-full bg-slate-50 border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all text-slate-900 font-mono ${
                      (touched.phone || formAttempted) && validationErrors.phone
                        ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/30 bg-rose-50/20'
                        : touched.phone && !validationErrors.phone
                        ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 bg-emerald-50/10'
                        : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'
                    }`}
                  />
                </div>
                {(touched.phone || formAttempted) && validationErrors.phone && (
                  <p className="mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{validationErrors.phone}</span>
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="booking-client-company" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Company / Organization Name
                  </label>
                  {companyName.trim() && touched.companyName && !validationErrors.companyName && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    name="organization"
                    id="booking-client-company"
                    autoComplete="organization"
                    inputMode="text"
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      if (!touched.companyName) setTouched(prev => ({ ...prev, companyName: true }));
                    }}
                    onBlur={() => handleBlurField('companyName')}
                    placeholder="e.g. Apex Global Ltd."
                    className={`w-full bg-slate-50 border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all text-slate-900 ${
                      (touched.companyName || formAttempted) && validationErrors.companyName
                        ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/30 bg-rose-50/20'
                        : companyName.trim() && touched.companyName && !validationErrors.companyName
                        ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 bg-emerald-50/10'
                        : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'
                    }`}
                  />
                </div>
                {(touched.companyName || formAttempted) && validationErrors.companyName && (
                  <p className="mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{validationErrors.companyName}</span>
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Brief Agenda / Matter Description (Optional)
                </label>
                <span className="text-[11px] text-emerald-700 font-bold">
                  Expertise: {isCustomExpertise ? (customExpertiseText || 'Custom') : selectedExpertise}
                </span>
              </div>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={`Provide key background (e.g. Assessment year, dispute amount, NBR notice date, or specific goals for ${isCustomExpertise ? (customExpertiseText || 'your matter') : selectedExpertise})...`}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Submission Bar & Summary */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-600 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Routing to <strong>{activePractice.leadPartner.name}</strong> • {bookingSettlementMode === 'pay_at_chamber' ? 'Slot reservation' : `UddoktaPay Retainer (BDT ${consultationFeeAmount.toLocaleString('en-IN')})`}.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl px-7 py-3 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{bookingSettlementMode === 'pay_at_chamber' ? 'Securing Chamber Slot...' : 'Verifying UddoktaPay & Booking...'}</span>
                </>
              ) : (
                <>
                  <span>
                    {bookingSettlementMode === 'pay_at_chamber'
                      ? 'Confirm Consultation Booking'
                      : `Confirm & Pay BDT ${consultationFeeAmount.toLocaleString('en-IN')} via UddoktaPay`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function activePartnerDescription(practice: PracticeAreaConfig): string {
  switch (practice.id) {
    case 'tax':
      return 'Senior Income Tax Practitioners (ITP) and chartered tax specialists handling corporate assessments, NBR show-cause notices, and appellate tribunal disputes.';
    case 'vat':
      return 'NBR Certified VAT Consultants advising on Mushak 9.1 reconciliations, input tax rebate optimization, and commissionerate audit defenses.';
    case 'corporate_law':
      return 'Advocates of the Supreme Court of Bangladesh (High Court Division) specializing in commercial arbitration, corporate disputes, and contract remedies.';
    case 'rjsc':
      return 'Corporate secretarial heads facilitating entity incorporation, foreign branch licensing (BIDA), share transfers, and annual statutory compliance.';
    case 'audit':
      return 'Fellow Chartered Accountants (ICAB) providing statutory audits, BIDA inward remittance attestations, and internal control assurance.';
    case 'cfo':
      return 'Fellow Cost & Management Accountants (FCMA) delivering multi-year financial modeling, startup fundraising preparation, and cash runway governance.';
    default:
      return 'Integrated cross-disciplinary partner advisory team across Accounticca and E-Lawyers Chambers.';
  }
}
