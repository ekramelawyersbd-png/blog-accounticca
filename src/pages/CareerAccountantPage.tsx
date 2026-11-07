import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { ServiceSEO } from '../components/SEO';
import {
  FileText,
  Printer,
  Download,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Building2,
  Briefcase,
  FileCheck2,
  Send,
  Calendar,
  MapPin,
  Users,
  Clock,
  Mail,
  Phone,
  Check,
  ChevronRight,
  Sparkles,
  BookOpen,
  Laptop,
  GraduationCap,
  Award,
  Copy,
  ExternalLink,
  ShieldCheck,
  Loader2,
  TrendingUp
} from 'lucide-react';
import type { CareerApplicationData } from '../utils/careerEmailTemplate';
import { submitCareerApplicationToApi } from '../utils/careerStorage';

interface FileMeta {
  fileName: string;
  fileType: string;
  sizeBytes: number;
}

interface ApplicationFormState {
  fullName: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  location: string;
  linkedin: string;
  highestQualification: string;
  degreeProgram: string;
  major: string;
  institution: string;
  graduationYear: string;
  academicResult: string;
  currentlyStudying: string;
  accountingPrinciplesRating: string;
  accountingActivities: string[];
  accountingSoftware: string[];
  excelSkill: string;
  taxVat: string;
  skillsDetails: string;
  workExperience: string;
  experienceLength: string;
  organization: string;
  jobTitle: string;
  responsibilities: string;
  training: string;
  trainingDetails: string;
  fullTime: string;
  joinTime: string;
  officeLocation: string;
  salary: string;
  noticePeriod: string;
  portfolio: string;
  motivation: string;
  declarationAccuracy: boolean;
  declarationContact: boolean;
}

const DRAFT_STORAGE_KEY = 'elaw_career_accountant_draft_v2';

const INITIAL_FORM_STATE: ApplicationFormState = {
  fullName: '',
  email: '',
  phone: '',
  whatsapp: '',
  address: '',
  location: '',
  linkedin: '',
  highestQualification: '',
  degreeProgram: '',
  major: '',
  institution: '',
  graduationYear: '',
  academicResult: '',
  currentlyStudying: '',
  accountingPrinciplesRating: '',
  accountingActivities: [],
  accountingSoftware: [],
  excelSkill: '',
  taxVat: '',
  skillsDetails: '',
  workExperience: '',
  experienceLength: '',
  organization: '',
  jobTitle: '',
  responsibilities: '',
  training: '',
  trainingDetails: '',
  fullTime: '',
  joinTime: '',
  officeLocation: '',
  salary: '',
  noticePeriod: '',
  portfolio: '',
  motivation: '',
  declarationAccuracy: false,
  declarationContact: false
};

const SAMPLE_FORM_STATE: ApplicationFormState = {
  fullName: 'Tanvir Ahmed Chowdhury',
  email: 'tanvir.ahmed.acc@example.com',
  phone: '01711223344',
  whatsapp: '01711223344',
  address: 'House 42, Road 9/A, Dhanmondi, Dhaka-1209',
  location: 'Dhaka',
  linkedin: 'https://www.linkedin.com/in/tanvir-ahmed-accounting',
  highestQualification: 'BBA (Accounting/Finance)',
  degreeProgram: 'Bachelor of Business Administration (BBA)',
  major: 'Accounting & Information Systems',
  institution: 'University of Dhaka',
  graduationYear: String(new Date().getFullYear() - 1),
  academicResult: 'CGPA 3.68/4.00',
  currentlyStudying: 'No',
  accountingPrinciplesRating: '4 - Advanced',
  accountingActivities: [
    'Bookkeeping and transaction entry',
    'General ledger maintenance',
    'Bank reconciliation',
    'Financial statement preparation',
    'Tax-related documentation',
    'VAT-related documentation'
  ],
  accountingSoftware: ['Microsoft Excel', 'QuickBooks', 'Tally'],
  excelSkill: 'Advanced',
  taxVat: 'Practical experience',
  skillsDetails:
    'Proficient in double-entry bookkeeping, monthly bank reconciliation, TDS/VDS withholding schedules under ITA 2023, Mushak-9.1 VAT return preparation, and automated financial statements in Excel.',
  workExperience: 'Internship or trainee experience only',
  experienceLength: 'Less than 1 year',
  organization: 'Rahman & Associates Chartered Accountants',
  jobTitle: 'Accounts & Tax Trainee',
  responsibilities:
    'Assisted senior accountants in daily voucher entry, ledger scrutiny, bank reconciliation statements, and preparing corporate tax & VAT compliance working papers for SME clients.',
  training: 'Yes',
  trainingDetails:
    'Completed 6-month practical training on Corporate Accounting, Income Tax Act 2023, and VAT Online Return Filing.',
  fullTime: 'Yes',
  joinTime: 'Within 7 days',
  officeLocation: 'Yes',
  salary: '28000',
  noticePeriod: 'Not applicable',
  portfolio: 'https://www.linkedin.com/in/tanvir-ahmed-accounting',
  motivation:
    'I am eager to join E-Lawyers as an Accountant to apply my foundation in financial reporting, bookkeeping, and Bangladesh Tax/VAT compliance while contributing to high-accuracy client accounting advisory.',
  declarationAccuracy: true,
  declarationContact: true
};

const ACCOUNTING_ACTIVITIES_OPTIONS = [
  { value: 'Bookkeeping and transaction entry', label: 'Bookkeeping and transaction entry' },
  { value: 'General ledger maintenance', label: 'General ledger maintenance' },
  { value: 'Accounts payable', label: 'Accounts payable' },
  { value: 'Accounts receivable', label: 'Accounts receivable' },
  { value: 'Bank reconciliation', label: 'Bank reconciliation' },
  { value: 'Financial statement preparation', label: 'Financial statement preparation' },
  { value: 'Financial reporting', label: 'Financial reporting' },
  { value: 'Tax-related documentation', label: 'Tax-related documentation' },
  { value: 'VAT-related documentation', label: 'VAT-related documentation' },
  { value: 'Client accounting support', label: 'Client accounting support' },
  {
    value: 'No experience yet; willing to learn',
    label: 'No experience yet, but willing to learn'
  },
  { value: 'Other accounting activities', label: 'Other' }
];

const ACCOUNTING_SOFTWARE_OPTIONS = [
  { value: 'Microsoft Excel', label: 'Microsoft Excel' },
  { value: 'QuickBooks', label: 'QuickBooks' },
  { value: 'Xero', label: 'Xero' },
  { value: 'Tally', label: 'Tally' },
  { value: 'Other accounting software', label: 'Other software' },
  { value: 'No prior software experience', label: 'No prior experience' }
];

const PRINCIPLES_SCALE = [
  { value: '1 - Beginner', num: '1', label: 'Beginner' },
  { value: '2 - Basic', num: '2', label: 'Basic' },
  { value: '3 - Intermediate', num: '3', label: 'Intermediate' },
  { value: '4 - Advanced', num: '4', label: 'Advanced' },
  { value: '5 - Expert', num: '5', label: 'Expert' }
];

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type TabMode = 'circular' | 'apply';

export const CareerAccountantPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'apply' ? 'apply' : 'circular';
  const [activeTab, setActiveTab] = useState<TabMode>(initialTab);

  const [formState, setFormState] = useState<ApplicationFormState>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.formState) {
          return { ...INITIAL_FORM_STATE, ...parsed.formState };
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_FORM_STATE;
  });

  const [cvFile, setCvFile] = useState<FileMeta | null>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.cvFile) return parsed.cvFile;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [cvError, setCvError] = useState<string>('');
  const [academicDocs, setAcademicDocs] = useState<FileMeta[]>([]);
  const [docsError, setDocsError] = useState<string>('');
  const [errorSummary, setErrorSummary] = useState<string>('');
  const [missingFieldsList, setMissingFieldsList] = useState<string[]>([]);
  const [isPreviewVisible, setIsPreviewVisible] = useState<boolean>(false);
  const [applicationRefId, setApplicationRefId] = useState<string>('ELAW-ACC-2026-8492');
  const [generatedAtLabel, setGeneratedAtLabel] = useState<string>('');
  const [generatedIso, setGeneratedIso] = useState<string>('');
  const [confirmClearOpen, setConfirmClearOpen] = useState<boolean>(false);
  const [actionToastMessage, setActionToastMessage] = useState<string>('');
  const [isSubmittedToHr, setIsSubmittedToHr] = useState<boolean>(false);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState<boolean>(false);
  const [copiedRefId, setCopiedRefId] = useState<boolean>(false);
  const [submissionReceipt, setSubmissionReceipt] = useState<{
    referenceId: string;
    candidateName: string;
    candidateEmail: string;
    hrEmails: string[];
    hrNotified: boolean;
    candidateNotified: boolean;
    emailTransport: string;
    submittedAt: string;
  } | null>(null);

  const formRef = useRef<HTMLFormElement | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement | null>(null);
  const resultCardRef = useRef<HTMLElement | null>(null);
  const cvInputRef = useRef<HTMLInputElement | null>(null);
  const docsInputRef = useRef<HTMLInputElement | null>(null);

  // Sync tab with URL
  const switchTab = (tab: TabMode) => {
    setActiveTab(tab);
    setSearchParams(tab === 'apply' ? { tab: 'apply' } : {});
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  // Persist draft in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({ formState, cvFile })
      );
    } catch {
      // ignore
    }
  }, [formState, cvFile]);

  const graduationYears = useMemo(() => {
    const thisYear = new Date().getFullYear();
    const years: string[] = [];
    for (let year = thisYear + 3; year >= thisYear - 35; year--) {
      years.push(String(year));
    }
    return years;
  }, []);

  const showWorkDetails =
    Boolean(formState.workExperience) &&
    formState.workExperience !== 'No professional experience';

  const showTrainingDetails = formState.training === 'Yes';

  const { progressPercent, completedCount, totalRequiredCount } = useMemo(() => {
    const checks = [
      formState.fullName.trim() !== '',
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim()),
      formState.phone.trim() !== '',
      formState.address.trim() !== '',
      formState.location.trim() !== '',
      formState.highestQualification.trim() !== '',
      formState.degreeProgram.trim() !== '',
      formState.major.trim() !== '',
      formState.institution.trim() !== '',
      formState.graduationYear.trim() !== '',
      formState.academicResult.trim() !== '',
      formState.currentlyStudying.trim() !== '',
      formState.accountingPrinciplesRating.trim() !== '',
      formState.accountingActivities.length > 0,
      formState.accountingSoftware.length > 0,
      formState.excelSkill.trim() !== '',
      formState.taxVat.trim() !== '',
      formState.workExperience.trim() !== '',
      formState.experienceLength.trim() !== '',
      formState.training.trim() !== '',
      formState.fullTime.trim() !== '',
      formState.joinTime.trim() !== '',
      formState.officeLocation.trim() !== '',
      formState.salary.trim() !== '' && Number(formState.salary) >= 0,
      formState.motivation.trim().length > 0,
      formState.declarationAccuracy,
      formState.declarationContact,
      Boolean(cvFile) && !cvError
    ];
    const completed = checks.filter(Boolean).length;
    const total = checks.length;
    return {
      progressPercent: total ? Math.round((completed / total) * 100) : 0,
      completedCount: completed,
      totalRequiredCount: total
    };
  }, [formState, cvFile, cvError]);

  const showActionFeedback = (msg: string) => {
    setActionToastMessage(msg);
    setTimeout(() => {
      setActionToastMessage((prev) => (prev === msg ? '' : prev));
    }, 4500);
  };

  const updateField = <K extends keyof ApplicationFormState>(
    key: K,
    value: ApplicationFormState[K]
  ) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleWorkExperienceChange = (value: string) => {
    setFormState((prev) => {
      const isNoExp = value === 'No professional experience';
      const hideDetails = !value || isNoExp;
      return {
        ...prev,
        workExperience: value,
        experienceLength: isNoExp ? 'No experience' : prev.experienceLength,
        organization: hideDetails ? '' : prev.organization,
        jobTitle: hideDetails ? '' : prev.jobTitle,
        responsibilities: hideDetails ? '' : prev.responsibilities
      };
    });
  };

  const handleTrainingChange = (value: string) => {
    setFormState((prev) => ({
      ...prev,
      training: value,
      trainingDetails: value === 'Yes' ? prev.trainingDetails : ''
    }));
  };

  const handleExclusiveCheckboxToggle = (
    field: 'accountingActivities' | 'accountingSoftware',
    optionValue: string,
    exclusiveValues: string[]
  ) => {
    setFormState((prev) => {
      const current = prev[field];
      const isCurrentlySelected = current.includes(optionValue);
      let next: string[];

      if (isCurrentlySelected) {
        next = current.filter((item) => item !== optionValue);
      } else if (exclusiveValues.includes(optionValue)) {
        next = [optionValue];
      } else {
        next = [
          ...current.filter((item) => !exclusiveValues.includes(item)),
          optionValue
        ];
      }

      return {
        ...prev,
        [field]: next
      };
    });
  };

  const handleCvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) {
      setCvFile(null);
      setCvError('');
      return;
    }
    if (files.length > 1) {
      setCvFile(null);
      setCvError('Please choose only one file.');
      return;
    }
    const file = files[0];
    if (file.size > MAX_FILE_BYTES) {
      setCvFile(null);
      setCvError(`Each file must be 10 MB or smaller: ${file.name}`);
      return;
    }
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext)) {
      setCvFile(null);
      setCvError(`Unsupported file type: ${file.name}. Please upload PDF, DOC, or DOCX.`);
      return;
    }
    setCvError('');
    setCvFile({
      fileName: file.name,
      fileType: file.type || 'application/pdf',
      sizeBytes: file.size
    });
  };

  const handleAcademicDocsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) {
      setAcademicDocs([]);
      setDocsError('');
      return;
    }
    const allowed = ['pdf', 'jpg', 'jpeg', 'png'];
    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        setAcademicDocs([]);
        setDocsError(`Each file must be 10 MB or smaller: ${file.name}`);
        return;
      }
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      if (!allowed.includes(ext)) {
        setAcademicDocs([]);
        setDocsError(`Unsupported file type: ${file.name}`);
        return;
      }
    }
    setDocsError('');
    setAcademicDocs(
      files.map((f) => ({
        fileName: f.name,
        fileType: f.type || 'unknown',
        sizeBytes: f.size
      }))
    );
  };

  const buildApplicationResponses = () => {
    const responses: Record<string, unknown> = {
      'Full Name': formState.fullName.trim(),
      'Email Address': formState.email.trim(),
      'Mobile Number': formState.phone.trim(),
      'WhatsApp Number': formState.whatsapp.trim(),
      'Current Address': formState.address.trim(),
      'Present Location': formState.location.trim(),
      'LinkedIn Profile URL': formState.linkedin.trim(),
      'Highest Educational Qualification': formState.highestQualification,
      'Degree / Program Name': formState.degreeProgram.trim(),
      'Major / Specialization': formState.major.trim(),
      'University / Institution': formState.institution.trim(),
      'Graduation Year / Expected Year': formState.graduationYear,
      'CGPA / GPA / Academic Result': formState.academicResult.trim(),
      'Currently Studying': formState.currentlyStudying,
      'Accounting Principles Rating': formState.accountingPrinciplesRating,
      'Accounting Activities':
        formState.accountingActivities.length === 1
          ? formState.accountingActivities[0]
          : formState.accountingActivities,
      'Accounting Software':
        formState.accountingSoftware.length === 1
          ? formState.accountingSoftware[0]
          : formState.accountingSoftware,
      'Microsoft Excel Skill Level': formState.excelSkill,
      'Tax and VAT Knowledge': formState.taxVat,
      'Relevant Accounting and Financial Skills': formState.skillsDetails.trim(),
      'Previous Work Experience': formState.workExperience,
      'Total Relevant Work Experience': formState.experienceLength
    };

    if (showWorkDetails) {
      responses['Previous or Current Organization'] = formState.organization.trim();
      responses['Previous Job Title'] = formState.jobTitle.trim();
      responses['Previous Role and Responsibilities'] = formState.responsibilities.trim();
    }

    responses['Accounting Internship or Training'] = formState.training;
    if (showTrainingDetails) {
      responses['Internship or Training Details'] = formState.trainingDetails.trim();
    }

    responses['Full-Time Availability'] = formState.fullTime;
    responses['Joining Availability'] = formState.joinTime;
    responses['Willing to Work in Panthapath Dhaka'] = formState.officeLocation;
    responses['Expected Monthly Salary BDT'] = formState.salary;
    responses['Currently Serving Notice Period'] = formState.noticePeriod;

    if (cvFile) {
      responses['CV File'] = cvFile;
    }
    if (academicDocs.length === 1) {
      responses['Academic Documents'] = academicDocs[0];
    } else if (academicDocs.length > 1) {
      responses['Academic Documents'] = academicDocs;
    }

    responses['Portfolio or Work Sample URL'] = formState.portfolio.trim();
    responses['Motivation to Join E-Lawyers'] = formState.motivation.trim();
    responses['Accuracy Declaration'] = formState.declarationAccuracy ? 'Agreed' : '';
    responses['Contact Consent'] = formState.declarationContact ? 'Agreed' : '';

    return responses;
  };

  const validateAllRequiredFields = (): string[] => {
    const missing: string[] = [];
    if (!formState.fullName.trim()) missing.push('Full Name');
    if (!formState.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) {
      missing.push('Valid Email Address');
    }
    if (!formState.phone.trim()) missing.push('Mobile Number');
    if (!formState.address.trim()) missing.push('Current Address');
    if (!formState.location.trim()) missing.push('Present Location (City/District)');
    if (!formState.highestQualification) missing.push('Highest Educational Qualification');
    if (!formState.degreeProgram.trim()) missing.push('Degree / Program Name');
    if (!formState.institution.trim()) missing.push('University / Institution');
    if (!formState.graduationYear) missing.push('Graduation Year / Expected Year');
    if (!formState.salary.trim() || Number(formState.salary) < 0) {
      missing.push('Expected Monthly Salary (BDT)');
    }
    if (cvError) {
      missing.push('Valid CV / Resume File (PDF/DOC/DOCX, max 10 MB)');
    }
    if (docsError) {
      missing.push('Valid Academic Documents (PDF/JPG/PNG, max 10 MB)');
    }
    if (!formState.declarationAccuracy) {
      missing.push('Accuracy Declaration Checkbox');
    }
    if (!formState.declarationContact) {
      missing.push('Contact Consent Checkbox');
    }
    return missing;
  };

  const triggerError = (message: string, missingList: string[] = []) => {
    setErrorSummary(message);
    setMissingFieldsList(missingList);
    setTimeout(() => {
      errorSummaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 30);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorSummary('');
    setMissingFieldsList([]);

    const missing = validateAllRequiredFields();
    if (missing.length > 0) {
      if (!cvFile && !cvError) {
        setCvError('Please attach your updated CV / Resume (PDF).');
      }
      triggerError(
        'Please complete all required fields and correct any highlighted issues before generating your application preview.',
        missing
      );
      return;
    }

    const now = new Date();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setApplicationRefId(`ELAW-ACC-${now.getFullYear()}-${randomSuffix}`);
    setGeneratedAtLabel(now.toLocaleString());
    setGeneratedIso(now.toISOString());
    setIsPreviewVisible(true);
    setIsSubmittedToHr(false);

    setTimeout(() => {
      resultCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleLoadSampleAndPreview = () => {
    setFormState(SAMPLE_FORM_STATE);
    const sampleCv: FileMeta = {
      fileName: 'Tanvir_Ahmed_Chowdhury_CV_2026.pdf',
      fileType: 'application/pdf',
      sizeBytes: 428 * 1024
    };
    setCvFile(sampleCv);
    setCvError('');
    setDocsError('');
    setErrorSummary('');
    setMissingFieldsList([]);
    const now = new Date();
    setApplicationRefId(`ELAW-ACC-${now.getFullYear()}-9204`);
    setGeneratedAtLabel(now.toLocaleString());
    setGeneratedIso(now.toISOString());
    setActiveTab('apply');
    setIsPreviewVisible(true);
    setIsSubmittedToHr(false);
    showActionFeedback('Sample candidate profile loaded and Application Preview generated.');
    setTimeout(() => {
      resultCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleDownloadJson = () => {
    const payload = {
      applicationReferenceId: applicationRefId,
      applicationPosition: 'Accountant',
      department: 'Accounts Division',
      employmentType: 'Full-Time',
      officeAddress:
        'G-5, BTI Centara Grand, 144-144/1 Green Road, Panthapath, Dhaka-1205, Bangladesh',
      generatedAt: generatedIso || new Date().toISOString(),
      submissionMode: isSubmittedToHr
        ? 'Submitted to E-Lawyers Recruitment Desk'
        : 'Validated Application Preview Export',
      responses: buildApplicationResponses(),
      attachmentsNotice:
        'The actual contents of attached files are not included. Attach the original files separately when submitting through an authorized channel.'
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'E-Lawyers_Accountant_Application.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showActionFeedback('Downloaded E-Lawyers_Accountant_Application.json');
  };

  const handlePrintAndSavePdf = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;

      // Navy Header Banner
      doc.setFillColor(16, 36, 58);
      doc.rect(0, 0, pageWidth, 108, 'F');

      // Gold Accent Line
      doc.setFillColor(199, 167, 107);
      doc.rect(0, 108, pageWidth, 4, 'F');

      doc.setTextColor(221, 195, 143);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('E-LAWYERS · LEGAL & BUSINESS CONSULTANCY FIRM', margin, 34);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text('Accountant Job Application — Official Preview', margin, 58);

      doc.setTextColor(214, 226, 235);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text(
        `Reference ID: ${applicationRefId}   |   Division: Accounts Division   |   Location: Panthapath, Dhaka`,
        margin,
        78
      );
      doc.text(
        `Generated On: ${generatedAtLabel || new Date().toLocaleString()}`,
        margin,
        93
      );

      let y = 132;

      previewRows.forEach((row, index) => {
        const keyLines = doc.splitTextToSize(row.keyLabel, 165);
        const valLines = doc.splitTextToSize(row.valueText || '—', contentWidth - 185);
        const rowHeight = Math.max(keyLines.length, valLines.length) * 13 + 12;

        if (y + rowHeight > pageHeight - 55) {
          doc.addPage();
          y = 45;
        }

        if (index % 2 === 0) {
          doc.setFillColor(247, 249, 251);
          doc.rect(margin, y, contentWidth, rowHeight, 'F');
        }

        doc.setDrawColor(223, 230, 236);
        doc.rect(margin, y, contentWidth, rowHeight, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(41, 59, 78);
        doc.text(keyLines, margin + 8, y + 15);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(36, 52, 70);
        doc.text(valLines, margin + 180, y + 15);

        y += rowHeight;
      });

      if (y + 40 > pageHeight - 30) {
        doc.addPage();
        y = 45;
      }
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(104, 120, 138);
      doc.text(
        'E-Lawyers Legal & Business Consultancy Firm · G-5, BTI Centara Grand, 144-144/1 Green Road, Panthapath, Dhaka-1205',
        margin,
        pageHeight - 24
      );

      doc.save('E-Lawyers_Accountant_Application.pdf');
      showActionFeedback('Saved PDF copy (E-Lawyers_Accountant_Application.pdf)');
    } catch {
      // Fallback
    }

    try {
      window.print();
    } catch {
      // ignore
    }
  };

  const handleEditApplication = () => {
    setIsPreviewVisible(false);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 30);
  };

  const handleConfirmClearForm = () => {
    setFormState(INITIAL_FORM_STATE);
    setCvFile(null);
    setCvError('');
    setAcademicDocs([]);
    setDocsError('');
    setErrorSummary('');
    setMissingFieldsList([]);
    setIsPreviewVisible(false);
    setIsSubmittedToHr(false);
    setConfirmClearOpen(false);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
    if (cvInputRef.current) cvInputRef.current.value = '';
    if (docsInputRef.current) docsInputRef.current.value = '';
    showActionFeedback('All form entries have been cleared.');
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleCopyRefId = () => {
    try {
      navigator.clipboard.writeText(applicationRefId);
      setCopiedRefId(true);
      showActionFeedback(`Copied Reference ID (${applicationRefId}) to clipboard.`);
      setTimeout(() => setCopiedRefId(false), 3000);
    } catch {
      showActionFeedback(`Reference ID: ${applicationRefId}`);
    }
  };

  const handleSubmitApplicationAndNotifyHr = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorSummary('');
    setMissingFieldsList([]);

    const missing = validateAllRequiredFields();
    if (missing.length > 0) {
      if (!cvFile && !cvError) {
        setCvError('Please attach your updated CV / Resume (PDF).');
      }
      triggerError(
        'Please complete all required fields and correct any highlighted issues before submitting to E-Lawyers HR.',
        missing
      );
      return;
    }

    setIsSubmittingApplication(true);

    const now = new Date();
    const currentRefId = applicationRefId || `ELAW-ACC-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setApplicationRefId(currentRefId);
    setGeneratedAtLabel(now.toLocaleString());
    setGeneratedIso(now.toISOString());

    const candidatePayload: CareerApplicationData = {
      applicationRefId: currentRefId,
      position: 'Accountant',
      department: 'Accounts Division',
      fullName: formState.fullName.trim(),
      email: formState.email.trim(),
      phone: formState.phone.trim(),
      whatsapp: formState.whatsapp.trim(),
      address: formState.address.trim(),
      location: formState.location.trim(),
      linkedin: formState.linkedin.trim(),
      highestQualification: formState.highestQualification,
      degreeProgram: formState.degreeProgram.trim(),
      major: formState.major.trim() || 'Accounting & Finance',
      institution: formState.institution.trim(),
      graduationYear: formState.graduationYear,
      academicResult: formState.academicResult.trim() || 'Passed',
      currentlyStudying: formState.currentlyStudying || 'No',
      accountingPrinciplesRating: formState.accountingPrinciplesRating || '4 - Advanced',
      accountingActivities: formState.accountingActivities.length > 0 ? formState.accountingActivities : ['Bookkeeping and transaction entry'],
      accountingSoftware: formState.accountingSoftware.length > 0 ? formState.accountingSoftware : ['Microsoft Excel'],
      excelSkill: formState.excelSkill || 'Intermediate',
      taxVat: formState.taxVat || 'Practical experience',
      skillsDetails: formState.skillsDetails.trim(),
      workExperience: formState.workExperience || 'Fresh Graduate',
      experienceLength: formState.experienceLength || 'Less than 1 year',
      organization: formState.organization.trim(),
      jobTitle: formState.jobTitle.trim(),
      responsibilities: formState.responsibilities.trim(),
      training: formState.training || 'Yes',
      trainingDetails: formState.trainingDetails.trim(),
      fullTime: formState.fullTime || 'Yes',
      joinTime: formState.joinTime || 'Immediately',
      officeLocation: formState.officeLocation || 'Yes',
      salary: formState.salary.trim(),
      noticePeriod: formState.noticePeriod || 'Not applicable',
      cvFileName: cvFile?.fileName || 'Candidate_CV.pdf',
      cvFileSize: cvFile?.sizeBytes || 428000,
      academicDocsSummary: academicDocs.map(d => `${d.fileName} (${Math.round(d.sizeBytes / 1024)} KB)`).join(', '),
      portfolio: formState.portfolio.trim(),
      motivation: formState.motivation.trim() || 'Interested in joining E-Lawyers as an Accountant.',
      submissionDate: now.toLocaleString()
    };

    try {
      const receipt = await submitCareerApplicationToApi(candidatePayload);
      setApplicationRefId(receipt.referenceId);
      setIsSubmittedToHr(true);
      setIsPreviewVisible(true);
      setSubmissionReceipt(receipt);
      showActionFeedback(
        `Application ${receipt.referenceId} submitted! E-Lawyers HR team notified at career@elawyersbd.com.`
      );
      setTimeout(() => {
        resultCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  const handleSubmitToHrDesk = () => {
    handleSubmitApplicationAndNotifyHr();
  };

  const previewRows = useMemo(() => {
    const displayLabels: Record<string, string> = {
      'Full Name': 'Full Name',
      'Email Address': 'Email Address',
      'Mobile Number': 'Mobile Number',
      'WhatsApp Number': 'WhatsApp Number',
      'Current Address': 'Current Address',
      'Present Location': 'Present Location',
      'LinkedIn Profile URL': 'LinkedIn Profile',
      'Highest Educational Qualification': 'Highest Qualification',
      'Degree / Program Name': 'Degree / Program',
      'Major / Specialization': 'Major / Specialization',
      'University / Institution': 'University / Institution',
      'Graduation Year / Expected Year': 'Graduation Year',
      'CGPA / GPA / Academic Result': 'Academic Result',
      'Currently Studying': 'Currently Studying',
      'Accounting Principles Rating': 'Accounting Principles Rating',
      'Accounting Activities': 'Accounting Activities',
      'Accounting Software': 'Accounting Software',
      'Microsoft Excel Skill Level': 'Excel Skill Level',
      'Tax and VAT Knowledge': 'Tax & VAT Knowledge',
      'Relevant Accounting and Financial Skills': 'Relevant Skills',
      'Previous Work Experience': 'Previous Work Experience',
      'Total Relevant Work Experience': 'Relevant Experience',
      'Previous or Current Organization': 'Organization',
      'Previous Job Title': 'Job Title',
      'Previous Role and Responsibilities': 'Role & Responsibilities',
      'Accounting Internship or Training': 'Internship / Training',
      'Internship or Training Details': 'Training Details',
      'Full-Time Availability': 'Full-Time Availability',
      'Joining Availability': 'Joining Availability',
      'Willing to Work in Panthapath Dhaka': 'Willing to Work in Panthapath, Dhaka',
      'Expected Monthly Salary BDT': 'Expected Monthly Salary (BDT)',
      'Currently Serving Notice Period': 'Notice Period',
      'CV File': 'CV / Resume',
      'Academic Documents': 'Academic Documents',
      'Portfolio or Work Sample URL': 'Portfolio / Work Sample',
      'Motivation to Join E-Lawyers': 'Reason for Joining E-Lawyers',
      'Accuracy Declaration': 'Accuracy Declaration',
      'Contact Consent': 'Contact Consent'
    };

    const metadata: Record<string, unknown> = {
      'Application Reference': applicationRefId,
      'Application Position': 'Accountant — Accounts Division',
      'Employment Type': 'Full-Time',
      'Office Location':
        'G-5, BTI Centara Grand, 144-144/1 Green Road, Panthapath, Dhaka-1205, Bangladesh',
      'Generated On': generatedAtLabel || new Date().toLocaleString()
    };

    const merged = { ...metadata, ...buildApplicationResponses() };
    const rows: { keyLabel: string; valueText: string }[] = [];

    Object.entries(merged).forEach(([key, value]) => {
      if (value === '' || value === undefined || value === null) return;
      if (Array.isArray(value) && value.length === 0) return;

      let formatted = '';
      if (
        Array.isArray(value) &&
        value.length > 0 &&
        typeof value[0] === 'object' &&
        value[0] !== null &&
        'fileName' in value[0]
      ) {
        formatted = (value as FileMeta[])
          .map((v) => `${v.fileName} (${formatBytes(v.sizeBytes)})`)
          .join('\n');
      } else if (Array.isArray(value)) {
        formatted = value.join(', ');
      } else if (typeof value === 'object' && value !== null && 'fileName' in value) {
        const f = value as FileMeta;
        formatted = `${f.fileName} (${formatBytes(f.sizeBytes)})`;
      } else if (key === 'Expected Monthly Salary BDT') {
        formatted = `BDT ${Number(value).toLocaleString()} / month`;
      } else {
        formatted = String(value);
      }

      rows.push({
        keyLabel: displayLabels[key] || key,
        valueText: formatted
      });
    });

    return rows;
  }, [
    formState,
    cvFile,
    academicDocs,
    applicationRefId,
    generatedAtLabel,
    showWorkDetails,
    showTrainingDetails
  ]);

  return (
    <div className="min-h-screen bg-[#f2f5f8] text-[#243446] text-[15px] leading-[1.55] pb-16 print:bg-white print:pb-0">
      <ServiceSEO
        title="We’re Hiring! Accountant (Accounts Division) | E-Lawyers Careers"
        description="Build your accounting career with E-Lawyers Legal & Business Consultancy Firm. Full-Time Accountant positions (2 vacancies) in Panthapath, Dhaka. Fresh graduates welcome. Deadline: October 31, 2026."
        serviceType="Job Recruitment Posting & Application"
        canonicalUrl="/Careers/accountant"
      />

      {/* Hero Header - Light Corporate Theme */}
      <header className="bg-gradient-to-b from-white via-[#f8fafc] to-[#f1f5f9] text-slate-800 pt-10 pb-20 px-5 border-b border-slate-200 relative overflow-hidden print:py-5 print:bg-white">
        {/* Subtle ultra-light background accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-200/15 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="max-w-[960px] mx-auto relative z-10">
          <div
            className="flex items-center justify-between gap-4 mb-6"
            aria-label="E-Lawyers"
          >
            <div className="flex items-center gap-3.5">
              <div className="grid place-items-center w-[46px] h-[46px] shrink-0 border-2 border-teal-600/25 rounded-xl bg-white text-[#167d83] font-extrabold tracking-tight text-[17px] shadow-xs">
                E-L
              </div>
              <div>
                <div className="text-[17px] font-bold tracking-wide text-[#10243a]">
                  E-Lawyers
                </div>
                <div className="text-slate-500 text-[11px] tracking-[0.15em] uppercase font-semibold">
                  Legal &amp; Business Consultancy Firm
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap print:hidden">
              <Link
                to="/Careers/mto"
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 hover:text-[#10243a] px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-all whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>MTO Opening</span>
              </Link>
              <Link
                to="/Careers/sales-marketing"
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-800 px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-all whitespace-nowrap shrink-0"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sales &amp; Marketing</span>
              </Link>
              <Link
                to="/Careers/customer-care"
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 hover:text-[#10243a] px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-all whitespace-nowrap shrink-0"
              >
                <span>Customer Care (2)</span>
              </Link>
              <Link
                to="/Careers"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Openings</span>
              </Link>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold mb-3 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" /> WE’RE HIRING! · ACCOUNTS DIVISION
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-[43px] font-black leading-[1.13] tracking-tight text-[#10243a]">
            Accountant
            <br />
            Job Announcement &amp; Application
          </h1>
          <p className="max-w-[720px] text-slate-600 mt-3.5 text-[15px] sm:text-base leading-relaxed">
            <strong className="text-slate-800">Build Your Accounting Career. Gain Practical Experience. Grow with E-Lawyers.</strong>
            <br />
            E-Lawyers Legal &amp; Business Consultancy Firm is expanding its Accounts Division and inviting applications from talented, dedicated, and motivated individuals for the position of Accountant. Fresh graduates are highly encouraged to apply.
          </p>

          {/* Unboxed Metadata Strip */}
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 mt-6 text-xs font-semibold text-slate-700">
            <span className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
              <Briefcase className="w-3.5 h-3.5 text-[#167d83]" />
              <span>Full-Time · Accounts Division</span>
            </span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono tabular-nums bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
              <Users className="w-3.5 h-3.5 text-[#167d83]" />
              <span>2 Vacancies</span>
            </span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-[#167d83]" />
              <span>Panthapath, Dhaka</span>
            </span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono tabular-nums text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              <span>Deadline: October 31, 2026</span>
            </span>
          </div>

          {/* Top Quick Action Button Bar */}
          <div className="flex flex-wrap items-center gap-3 mt-7 print:hidden">
            <button
              type="button"
              onClick={() => switchTab('apply')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0 shadow-xs ${
                activeTab === 'apply'
                  ? 'bg-[#167d83] text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-300" />
              <span>Apply for This Position</span>
            </button>

            <button
              type="button"
              onClick={() => switchTab('circular')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'circular'
                  ? 'bg-white text-[#10243a] border-2 border-slate-300 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#167d83]" />
              <span>Read Full Job Circular</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Wrap */}
      <main className="relative z-20 max-w-[960px] mx-auto px-4 sm:px-6 -mt-10 print:mt-2 print:px-0">
        {/* View Switcher Tabs (Job Circular vs Online Application) */}
        <div className="bg-white border border-[#dfe6ec] rounded-2xl shadow-sm p-1.5 mb-5 flex items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => switchTab('circular')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'circular'
                  ? 'bg-[#10243a] text-white shadow-xs'
                  : 'text-[#526276] hover:text-[#10243a] hover:bg-[#f2f5f8]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Job Overview &amp; Circular</span>
            </button>
            <button
              type="button"
              onClick={() => switchTab('apply')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'apply'
                  ? 'bg-[#167d83] text-white shadow-xs'
                  : 'text-[#526276] hover:text-[#10243a] hover:bg-[#f2f5f8]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Online Application Form</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleLoadSampleAndPreview}
            className="text-xs font-bold text-[#10666b] hover:text-[#167d83] hover:underline px-3 py-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            Load Sample Candidate &amp; Preview
          </button>
        </div>

        {/* Action Toast Feedback */}
        {actionToastMessage && (
          <div
            className="mb-4 border border-[#b7e4c7] bg-[#ecfdf3] text-[#16734b] rounded-xl px-4 py-3 text-[13px] font-semibold flex items-center justify-between gap-3 print:hidden"
            role="status"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionToastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionToastMessage('')}
              className="text-xs underline cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 1: COMPLETE JOB CIRCULAR & DETAILS */}
        {activeTab === 'circular' && (
          <div className="space-y-6 print:hidden">
            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-[#dfe6ec] rounded-xl p-4">
                <div className="text-xs text-[#68788a] font-medium">Position</div>
                <div className="text-sm font-bold text-[#10243a] mt-0.5">Accountant</div>
                <div className="text-xs text-[#167d83] font-semibold mt-1">Accounts Division</div>
              </div>
              <div className="bg-white border border-[#dfe6ec] rounded-xl p-4">
                <div className="text-xs text-[#68788a] font-medium">Employment &amp; Openings</div>
                <div className="text-sm font-bold text-[#10243a] mt-0.5">Full-Time (2 Vacancies)</div>
                <div className="text-xs text-[#526276] mt-1">Fresh graduates welcome</div>
              </div>
              <div className="bg-white border border-[#dfe6ec] rounded-xl p-4">
                <div className="text-xs text-[#68788a] font-medium">Application Deadline</div>
                <div className="text-sm font-bold text-[#b42318] font-mono tabular-nums mt-0.5">October 31, 2026</div>
                <div className="text-xs text-[#526276] mt-1">Direct online application</div>
              </div>
              <div className="bg-white border border-[#dfe6ec] rounded-xl p-4">
                <div className="text-xs text-[#68788a] font-medium">Work Location</div>
                <div className="text-sm font-bold text-[#10243a] mt-0.5">Panthapath, Dhaka</div>
                <div className="text-xs text-[#526276] mt-1">BTI Centara Grand, Green Rd</div>
              </div>
            </div>

            {/* About E-Lawyers */}
            <section className="bg-white border border-[#dfe6ec] rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#167d83] uppercase tracking-wider">
                <Building2 className="w-4 h-4" />
                <span>Firm Overview &amp; Model</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#10243a]">
                About E-Lawyers Legal &amp; Business Consultancy Firm
              </h2>
              <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
                <p>
                  E-Lawyers is a professional legal and business consultancy firm committed to providing dependable services that support the needs of individuals and businesses.
                </p>
                <p>
                  Our operations are organized into two major divisions: the <strong>Legal Division</strong> and the <strong>Accounts Division</strong>.
                </p>
                <p>
                  The Legal Division provides professional legal support and court-related services, while the Accounts Division focuses on delivering comprehensive accounting solutions to business clients through a business-to-business (B2B) service model.
                </p>
                <p>
                  Our accounting services support businesses in maintaining organized financial records, managing accounting operations, preparing financial reports, and addressing relevant tax, VAT, and financial compliance requirements.
                </p>
                <p>
                  As our Accounts Division continues to expand, we are strengthening our team with individuals who value accuracy, accountability, professional communication, and continuous learning.
                </p>
              </div>
            </section>

            {/* Why Join E-Lawyers */}
            <section className="bg-white border border-[#dfe6ec] rounded-2xl p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#167d83] uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#c7a76b]" />
                <span>Professional Advantages</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#10243a]">
                Why Join E-Lawyers?
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div className="border border-[#dfe6ec] rounded-xl p-5 bg-[#fbfcfd] space-y-2">
                  <div className="text-xs font-bold text-[#10666b]">01. Practical Experience with Real Clients</div>
                  <h3 className="font-bold text-[#10243a] text-base">Real B2B Client Portfolios</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Working in a B2B accounting service environment provides exposure to bookkeeping, financial documentation, reconciliation, and reporting across varied industries.
                  </p>
                </div>

                <div className="border border-[#dfe6ec] rounded-xl p-5 bg-[#fbfcfd] space-y-2">
                  <div className="text-xs font-bold text-[#10666b]">02. Fresh Graduate Welcome</div>
                  <h3 className="font-bold text-[#10243a] text-base">Strong Academic Onboarding</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    You do not need years of prior professional experience. We recognize motivated graduates with sound academic fundamentals and a commitment to learn.
                  </p>
                </div>

                <div className="border border-[#dfe6ec] rounded-xl p-5 bg-[#fbfcfd] space-y-2">
                  <div className="text-xs font-bold text-[#10666b]">03. 360° Accounting Operations</div>
                  <h3 className="font-bold text-[#10243a] text-base">Comprehensive Accounting Scope</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Gain exposure to bookkeeping, ledger maintenance, financial statements, AP/AR, bank reconciliation, and practical Bangladesh Tax &amp; VAT compliance procedures.
                  </p>
                </div>

                <div className="border border-[#dfe6ec] rounded-xl p-5 bg-[#fbfcfd] space-y-2">
                  <div className="text-xs font-bold text-[#10666b]">04. Long-Term Career Growth</div>
                  <h3 className="font-bold text-[#10243a] text-base">Expanding Consultancy Practice</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    We value individuals who take on responsibility over time. As our Accounts Division continues to expand, you will have opportunities for career advancement.
                  </p>
                </div>
              </div>
            </section>

            {/* Key Job Responsibilities */}
            <section className="bg-white border border-[#dfe6ec] rounded-2xl p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#167d83] uppercase tracking-wider">
                <Briefcase className="w-4 h-4" />
                <span>Scope of Work</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#10243a]">
                Key Job Responsibilities
              </h2>

              <div className="space-y-4 divide-y divide-[#dfe6ec]">
                <div className="pt-3 first:pt-0 space-y-2">
                  <h3 className="text-base font-bold text-[#10243a]">1. Accounting Operations and Bookkeeping</h3>
                  <ul className="text-xs sm:text-sm text-slate-600 space-y-1.5 list-disc pl-5">
                    <li>Manage accounting operations for assigned business clients.</li>
                    <li>Maintain accurate financial records, bookkeeping entries, and transaction documentation.</li>
                    <li>Record and organize financial transactions systematically.</li>
                    <li>Prepare and maintain general ledgers and other relevant accounting records.</li>
                  </ul>
                </div>

                <div className="pt-4 space-y-2">
                  <h3 className="text-base font-bold text-[#10243a]">2. Financial Reporting and Reconciliation</h3>
                  <ul className="text-xs sm:text-sm text-slate-600 space-y-1.5 list-disc pl-5">
                    <li>Assist in preparing financial statements, accounting reports, and other financial information.</li>
                    <li>Handle accounts payable and accounts receivable activities.</li>
                    <li>Perform bank reconciliation and investigate discrepancies when necessary.</li>
                    <li>Support the preparation of monthly, quarterly, and annual financial reports.</li>
                  </ul>
                </div>

                <div className="pt-4 space-y-2">
                  <h3 className="text-base font-bold text-[#10243a]">3. Tax, VAT, and Compliance Support</h3>
                  <ul className="text-xs sm:text-sm text-slate-600 space-y-1.5 list-disc pl-5">
                    <li>Assist with tax, VAT, and financial compliance-related activities.</li>
                    <li>Maintain relevant supporting documents and financial records.</li>
                    <li>Help ensure that accounting information is accurate, organized, and prepared in accordance with applicable requirements.</li>
                  </ul>
                </div>

                <div className="pt-4 space-y-2">
                  <h3 className="text-base font-bold text-[#10243a]">4. Client Support and Communication</h3>
                  <ul className="text-xs sm:text-sm text-slate-600 space-y-1.5 list-disc pl-5">
                    <li>Assist business clients with their accounting requirements and financial documentation.</li>
                    <li>Communicate accounting matters professionally and clearly.</li>
                    <li>Coordinate with internal team members to support timely service delivery.</li>
                  </ul>
                </div>

                <div className="pt-4 space-y-2">
                  <h3 className="text-base font-bold text-[#10243a]">5. Quality and Professional Responsibility</h3>
                  <ul className="text-xs sm:text-sm text-slate-600 space-y-1.5 list-disc pl-5">
                    <li>Maintain accuracy, confidentiality, and attention to detail.</li>
                    <li>Identify inconsistencies in financial records and support corrective action.</li>
                    <li>Manage assigned tasks responsibly and contribute to the overall efficiency of the Accounts Division.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Educational Qualifications & Required Skills */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-[#dfe6ec] rounded-2xl p-6 sm:p-7 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#167d83] uppercase tracking-wider">
                  <GraduationCap className="w-4 h-4" />
                  <span>Academic Eligibility</span>
                </div>
                <h3 className="text-lg font-bold text-[#10243a]">Educational Qualifications</h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Bachelor&apos;s or master&apos;s degree in Accounting, Finance, Business Administration, or a related field:
                </p>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
                  <span className="px-3 py-1 bg-[#f2f5f8] rounded-lg">B.Com</span>
                  <span className="px-3 py-1 bg-[#f2f5f8] rounded-lg">BBA (Accounting/Finance)</span>
                  <span className="px-3 py-1 bg-[#f2f5f8] rounded-lg">M.Com</span>
                  <span className="px-3 py-1 bg-[#f2f5f8] rounded-lg">MBA (Accounting/Finance)</span>
                  <span className="px-3 py-1 bg-[#f2f5f8] rounded-lg">Other equivalent degrees</span>
                </div>
              </div>

              <div className="bg-white border border-[#dfe6ec] rounded-2xl p-6 sm:p-7 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#167d83] uppercase tracking-wider">
                  <Laptop className="w-4 h-4" />
                  <span>Software Advantage</span>
                </div>
                <h3 className="text-lg font-bold text-[#10243a]">Technical Competencies</h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Working knowledge of Microsoft Excel. Experience with any of the following platforms is an added advantage:
                </p>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
                  <span className="px-3 py-1 bg-[#e8f3f3] text-[#10666b] rounded-lg">Microsoft Excel</span>
                  <span className="px-3 py-1 bg-[#e8f3f3] text-[#10666b] rounded-lg">QuickBooks</span>
                  <span className="px-3 py-1 bg-[#e8f3f3] text-[#10666b] rounded-lg">Xero</span>
                  <span className="px-3 py-1 bg-[#e8f3f3] text-[#10666b] rounded-lg">Tally</span>
                  <span className="px-3 py-1 bg-[#e8f3f3] text-[#10666b] rounded-lg">Tax &amp; VAT Procedures</span>
                </div>
              </div>
            </section>

            {/* Compensation & Contact */}
            <section className="bg-white border border-[#dfe6ec] rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#167d83] uppercase tracking-wider">
                <Award className="w-4 h-4" />
                <span>Compensation &amp; Recruitment Desk</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#10243a]">
                Salary, Location &amp; Contact Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="space-y-1">
                  <div className="font-bold text-slate-800">Salary Package:</div>
                  <div className="text-slate-600">
                    Competitive salary determined based on the candidate&apos;s relevant skills, qualifications, and overall suitability.
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-slate-800">Office Location:</div>
                  <div className="text-slate-600">
                    G-5, BTI Centara Grand, 144–144/1 Green Road, Panthapath, Dhaka-1205.
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-slate-800">Recruitment Inquiries:</div>
                  <div className="text-slate-600">
                    <a href="mailto:career@elawyersbd.com" className="text-[#167d83] hover:underline">
                      career@elawyersbd.com
                    </a>{' '}
                    or{' '}
                    <a href="mailto:career@accounticca.com" className="text-[#167d83] hover:underline">
                      career@accounticca.com
                    </a>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-slate-800">Telephone Hotline:</div>
                  <div className="font-mono tabular-nums text-slate-600">
                    <a href="tel:+8801313583838" className="hover:underline">
                      +880 1313-583838
                    </a>
                  </div>
                </div>
              </div>

              {/* Bottom CTA to Switch to Application Form */}
              <div className="pt-4 border-t border-[#dfe6ec] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-600">
                  Ready to take the next step in your accounting career?
                </div>
                <button
                  type="button"
                  onClick={() => switchTab('apply')}
                  className="px-5 py-2.5 rounded-xl bg-[#167d83] hover:bg-[#10666b] text-white font-bold text-xs inline-flex items-center justify-center gap-2 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Proceed to Online Application Form</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: INTERACTIVE APPLICATION FORM & PREVIEW */}
        {activeTab === 'apply' && (
          <div className="app-form-60 w-full lg:w-[60vw] mx-auto space-y-4">
            {/* Template Notice */}
            <div
              className="bg-[#fffaf0] border border-[#ead9b4] text-[#55482c] rounded-xl px-4 py-3.5 mb-4 shadow-xs text-[13px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden"
              role="note"
            >
              <div>
                <strong>Application Form &amp; Instant Preview:</strong> Complete all required fields across the 7 sections below. Use <strong>“Generate Preview”</strong> to validate your entries, download a <code>.json</code> data copy, or print/save the formatted application as a PDF.
              </div>
              <button
                type="button"
                onClick={handleLoadSampleAndPreview}
                className="px-3 py-1.5 rounded-lg bg-[#10243a] hover:bg-[#193650] text-white text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 transition-colors"
              >
                Load Sample Candidate
              </button>
            </div>

            {/* Progress Card */}
            <div
              className="bg-white border border-[#dfe6ec] rounded-[14px] shadow-sm px-5 py-4 mb-4 print:hidden"
              aria-label="Form progress"
            >
              <div className="flex flex-wrap items-center justify-between gap-3.5 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[#10243a] font-bold text-[13px]">
                    Application progress
                  </span>
                  <span className="text-[#68788a] text-xs font-mono tabular-nums">
                    ({completedCount} of {totalRequiredCount} checkpoints)
                  </span>
                </div>
                <span
                  className="text-[#167d83] text-xs font-mono tabular-nums font-bold"
                  id="progressText"
                >
                  {progressPercent}% completed
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#e9eef2] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#167d83] to-[#4aa6a2] transition-all duration-200"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Error Summary */}
            {errorSummary && (
              <div
                ref={errorSummaryRef}
                className="mb-4 border border-[#f0b6b1] text-[#85251d] rounded-xl bg-[#fff7f6] px-4 py-3.5 text-[13px] space-y-2 print:hidden"
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-start gap-2.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-[#b42318] shrink-0 mt-0.5" />
                  <span>{errorSummary}</span>
                </div>
                {missingFieldsList.length > 0 && (
                  <div className="pl-6 text-xs text-[#85251d]">
                    <span className="font-semibold">Incomplete required items: </span>
                    <span>{missingFieldsList.join(' · ')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Application Form (Sections 01 - 07) */}
            <form
              ref={formRef}
              id="applicationForm"
              noValidate
              onSubmit={handleSubmit}
              className="space-y-4 print:hidden"
            >
              {/* Section 01: Personal Information */}
              <section
                className="bg-white border border-[#dfe6ec] rounded-[14px] shadow-sm overflow-hidden"
                aria-labelledby="personal-heading"
              >
                <div className="flex items-start gap-3.5 bg-[#fbfcfd] px-5 sm:px-6 py-5 border-b border-[#dfe6ec]">
                  <div className="grid place-items-center w-[34px] h-[34px] shrink-0 rounded-[10px] bg-[#e8f3f3] text-[#10666b] font-extrabold font-mono tabular-nums text-sm">
                    01
                  </div>
                  <div>
                    <h2
                      id="personal-heading"
                      className="text-[#10243a] text-[17px] font-bold leading-snug"
                    >
                      Personal Information
                    </h2>
                    <p className="text-[#68788a] text-[13px] mt-0.5">
                      Provide accurate contact and identity details.
                    </p>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                    <div>
                      <label
                        htmlFor="fullName"
                        className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                      >
                        Full Name <span className="text-[#b5473c]">*</span>
                      </label>
                      <input
                        id="fullName"
                        name="Full Name"
                        type="text"
                        inputMode="text"
                        autoComplete="name"
                        required
                        value={formState.fullName}
                        onChange={(e) => updateField('fullName', e.target.value)}
                        placeholder="Enter your full name"
                        className="block w-full min-h-[44px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white focus:outline-none focus:border-[#167d83] focus:ring-3 focus:ring-[#167d83]/12"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                      >
                        Email Address <span className="text-[#b5473c]">*</span>
                      </label>
                      <input
                        id="email"
                        name="Email Address"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        required
                        value={formState.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="name@example.com"
                        className="block w-full min-h-[44px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white focus:outline-none focus:border-[#167d83] focus:ring-3 focus:ring-[#167d83]/12"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                      >
                        Mobile Number <span className="text-[#b5473c]">*</span>
                      </label>
                      <input
                        id="phone"
                        name="Mobile Number"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        required
                        value={formState.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder="e.g. 01XXXXXXXXX"
                        className="block w-full min-h-[44px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white font-mono tabular-nums focus:outline-none focus:border-[#167d83] focus:ring-3 focus:ring-[#167d83]/12"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="whatsapp"
                        className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                      >
                        WhatsApp Number
                      </label>
                      <input
                        id="whatsapp"
                        name="WhatsApp Number"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={formState.whatsapp}
                        onChange={(e) => updateField('whatsapp', e.target.value)}
                        placeholder="If different from mobile number"
                        className="block w-full min-h-[44px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white font-mono tabular-nums focus:outline-none focus:border-[#167d83] focus:ring-3 focus:ring-[#167d83]/12"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="address"
                        className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                      >
                        Current Address <span className="text-[#b5473c]">*</span>
                      </label>
                      <textarea
                        id="address"
                        name="Current Address"
                        autoComplete="street-address"
                        required
                        rows={3}
                        value={formState.address}
                        onChange={(e) => updateField('address', e.target.value)}
                        placeholder="House/road, area, city or district"
                        className="block w-full min-h-[104px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white resize-y focus:outline-none focus:border-[#167d83] focus:ring-3 focus:ring-[#167d83]/12"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="location"
                        className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                      >
                        Present Location (City/District) <span className="text-[#b5473c]">*</span>
                      </label>
                      <input
                        id="location"
                        name="Present Location"
                        type="text"
                        inputMode="text"
                        autoComplete="address-level2"
                        required
                        value={formState.location}
                        onChange={(e) => updateField('location', e.target.value)}
                        placeholder="e.g. Dhaka"
                        className="block w-full min-h-[44px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white focus:outline-none focus:border-[#167d83] focus:ring-3 focus:ring-[#167d83]/12"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="linkedin"
                        className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                      >
                        LinkedIn Profile URL
                      </label>
                      <input
                        id="linkedin"
                        name="LinkedIn Profile URL"
                        type="url"
                        inputMode="url"
                        value={formState.linkedin}
                        onChange={(e) => updateField('linkedin', e.target.value)}
                        placeholder="https://www.linkedin.com/in/..."
                        className="block w-full min-h-[44px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white focus:outline-none focus:border-[#167d83] focus:ring-3 focus:ring-[#167d83]/12"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 02: Educational Qualifications */}
              <section
                className="bg-white border border-[#dfe6ec] rounded-[14px] shadow-sm overflow-hidden"
                aria-labelledby="education-heading"
              >
                <div className="flex items-start gap-3.5 bg-[#fbfcfd] px-5 sm:px-6 py-5 border-b border-[#dfe6ec]">
                  <div className="grid place-items-center w-[34px] h-[34px] shrink-0 rounded-[10px] bg-[#e8f3f3] text-[#10666b] font-extrabold font-mono tabular-nums text-sm">
                    02
                  </div>
                  <div>
                    <h2
                      id="education-heading"
                      className="text-[#10243a] text-[17px] font-bold leading-snug"
                    >
                      Educational Qualifications
                    </h2>
                    <p className="text-[#68788a] text-[13px] mt-0.5">
                      Share your most recent or highest completed qualification.
                    </p>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                    <div>
                      <label
                        htmlFor="highestQualification"
                        className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                      >
                        Highest Educational Qualification <span className="text-[#b5473c]">*</span>
                      </label>
                      <select
                        id="highestQualification"
                        name="Highest Educational Qualification"
                        required
                        value={formState.highestQualification}
                        onChange={(e) => updateField('highestQualification', e.target.value)}
                        className="block w-full min-h-[44px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white focus:outline-none focus:border-[#167d83] focus:ring-3 focus:ring-[#167d83]/12"
                      >
                        <option value="">Select qualification</option>
                        <option value="B.Com">B.Com</option>
                        <option value="BBA (Accounting/Finance)">BBA (Accounting/Finance)</option>
                        <option value="BBA (Other specialization)">BBA (Other specialization)</option>
                        <option value="M.Com">M.Com</option>
                        <option value="MBA (Accounting/Finance)">MBA (Accounting/Finance)</option>
                        <option value="Other relevant degree">Other relevant degree</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="degreeProgram"
                        className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                      >
                        Degree / Program Name <span className="text-[#b5473c]">*</span>
                      </label>
                      <input
                        id="degreeProgram"
                        name="Degree / Program Name"
                        type="text"
                        required
                        value={formState.degreeProgram}
                        onChange={(e) => updateField('degreeProgram', e.target.value)}
                        placeholder="e.g. Bachelor of Business Administration"
                        className="block w-full min-h-[44px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white focus:outline-none focus:border-[#167d83] focus:ring-3 focus:ring-[#167d83]/12"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="major"
                        className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                      >
                        Major / Specialization <span className="text-[#b5473c]">*</span>
                      </label>
                      <input
                        id="major"
                        name="Major / Specialization"
                        type="text"
                        required
                        value={formState.major}
                        onChange={(e) => updateField('major', e.target.value)}
                        placeholder="e.g. Accounting"
                        className="block w-full min-h-[44px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white focus:outline-none focus:border-[#167d83] focus:ring-3 focus:ring-[#167d83]/12"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="institution"
                        className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                      >
                        University / Institution <span className="text-[#b5473c]">*</span>
                      </label>
                      <input
                        id="institution"
                        name="University / Institution"
                        type="text"
                        required
                        value={formState.institution}
                        onChange={(e) => updateField('institution', e.target.value)}
                        placeholder="Institution name"
                        className="block w-full min-h-[44px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white focus:outline-none focus:border-[#167d83] focus:ring-3 focus:ring-[#167d83]/12"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="graduationYear"
                        className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                      >
                        Graduation Year / Expected Year <span className="text-[#b5473c]">*</span>
                      </label>
                      <select
                        id="graduationYear"
                        name="Graduation Year / Expected Year"
                        required
                        value={formState.graduationYear}
                        onChange={(e) => updateField('graduationYear', e.target.value)}
                        className="block w-full min-h-[44px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white font-mono tabular-nums focus:outline-none focus:border-[#167d83] focus:ring-3 focus:ring-[#167d83]/12"
                      >
                        <option value="">Select year</option>
                        {graduationYears.map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="academicResult"
                        className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                      >
                        CGPA / GPA / Academic Result <span className="text-[#b5473c]">*</span>
                      </label>
                      <input
                        id="academicResult"
                        name="CGPA / GPA / Academic Result"
                        type="text"
                        required
                        value={formState.academicResult}
                        onChange={(e) => updateField('academicResult', e.target.value)}
                        placeholder="e.g. CGPA 3.50/4.00"
                        className="block w-full min-h-[44px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white font-mono tabular-nums focus:outline-none focus:border-[#167d83] focus:ring-3 focus:ring-[#167d83]/12"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <span className="block text-[#293b4e] font-bold text-[13px] mb-2">
                        Are you currently studying? <span className="text-[#b5473c]">*</span>
                      </span>
                      <div className="flex flex-wrap gap-2.5">
                        {['Yes', 'No', 'Awaiting final results'].map((opt) => (
                          <label
                            key={opt}
                            className={`flex items-center gap-2.5 px-3.5 py-2.5 min-w-[120px] min-h-[42px] border rounded-lg text-[13px] font-medium cursor-pointer transition-colors ${
                              formState.currentlyStudying === opt
                                ? 'border-[#167d83] bg-[#f4fbfb] text-[#10243a]'
                                : 'border-[#dfe6ec] bg-white hover:border-[#9bc7c8] hover:bg-[#fbfefe]'
                            }`}
                          >
                            <input
                              type="radio"
                              name="Currently Studying"
                              value={opt}
                              required
                              checked={formState.currentlyStudying === opt}
                              onChange={(e) => updateField('currentlyStudying', e.target.value)}
                              className="accent-[#167d83]"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 03: Accounting Skills & Technical Competencies */}
              <section
                className="bg-white border border-[#dfe6ec] rounded-[14px] shadow-sm overflow-hidden"
                aria-labelledby="skills-heading"
              >
                <div className="flex items-start gap-3.5 bg-[#fbfcfd] px-5 sm:px-6 py-5 border-b border-[#dfe6ec]">
                  <div className="grid place-items-center w-[34px] h-[34px] shrink-0 rounded-[10px] bg-[#e8f3f3] text-[#10666b] font-extrabold font-mono tabular-nums text-sm">
                    03
                  </div>
                  <div>
                    <h2
                      id="skills-heading"
                      className="text-[#10243a] text-[17px] font-bold leading-snug"
                    >
                      Accounting Skills &amp; Technical Competencies
                    </h2>
                    <p className="text-[#68788a] text-[13px] mt-0.5">
                      Select the areas you know. Practical experience is an advantage, not a requirement for fresh graduates.
                    </p>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                    <div className="sm:col-span-2">
                      <span className="block text-[#293b4e] font-bold text-[13px] mb-2">
                        How would you rate your understanding of accounting principles?{' '}
                        <span className="text-[#b5473c]">*</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {PRINCIPLES_SCALE.map((scale) => (
                          <label
                            key={scale.value}
                            className={`flex flex-col items-center gap-1 min-w-[76px] p-2.5 border rounded-lg cursor-pointer text-[11px] transition-colors ${
                              formState.accountingPrinciplesRating === scale.value
                                ? 'border-[#167d83] bg-[#f4fbfb] text-[#10243a] font-bold'
                                : 'border-[#dfe6ec] bg-white text-[#68788a] hover:border-[#9bc7c8]'
                            }`}
                          >
                            <input
                              type="radio"
                              name="Accounting Principles Rating"
                              value={scale.value}
                              required
                              checked={formState.accountingPrinciplesRating === scale.value}
                              onChange={(e) =>
                                updateField('accountingPrinciplesRating', e.target.value)
                              }
                              className="accent-[#167d83]"
                            />
                            <span className="font-mono tabular-nums text-xs font-bold text-[#10243a]">
                              {scale.num}
                            </span>
                            <span>{scale.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="block text-[#293b4e] font-bold text-[13px] mb-2">
                        Which accounting activities are you familiar with?{' '}
                        <span className="text-[#b5473c]">*</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {ACCOUNTING_ACTIVITIES_OPTIONS.map((item) => {
                          const checked = formState.accountingActivities.includes(item.value);
                          return (
                            <label
                              key={item.value}
                              className={`flex items-start gap-2.5 px-3 py-2.5 min-h-[42px] border rounded-lg text-[13px] font-medium cursor-pointer transition-colors ${
                                checked
                              ? 'border-[#167d83] bg-[#f4fbfb] text-[#10243a]'
                              : 'border-[#dfe6ec] bg-white hover:border-[#9bc7c8] hover:bg-[#fbfefe]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                name="Accounting Activities"
                                value={item.value}
                                checked={checked}
                                onChange={() =>
                                  handleExclusiveCheckboxToggle(
                                    'accountingActivities',
                                    item.value,
                                    ['No experience yet; willing to learn']
                                  )
                                }
                                className="mt-0.5 accent-[#167d83] shrink-0"
                              />
                              <span>{item.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="block text-[#293b4e] font-bold text-[13px] mb-2">
                        Which accounting software or tools have you used?{' '}
                        <span className="text-[#b5473c]">*</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {ACCOUNTING_SOFTWARE_OPTIONS.map((item) => {
                          const checked = formState.accountingSoftware.includes(item.value);
                          return (
                            <label
                              key={item.value}
                              className={`flex items-start gap-2.5 px-3 py-2.5 min-h-[42px] border rounded-lg text-[13px] font-medium cursor-pointer transition-colors ${
                                checked
                                  ? 'border-[#167d83] bg-[#f4fbfb] text-[#10243a]'
                                  : 'border-[#dfe6ec] bg-white hover:border-[#9bc7c8] hover:bg-[#fbfefe]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                name="Accounting Software"
                                value={item.value}
                                checked={checked}
                                onChange={() =>
                                  handleExclusiveCheckboxToggle(
                                    'accountingSoftware',
                                    item.value,
                                    ['No prior software experience']
                                  )
                                }
                                className="mt-0.5 accent-[#167d83] shrink-0"
                              />
                              <span>{item.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="excelSkill"
                        className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                      >
                        Microsoft Excel Skill Level <span className="text-[#b5473c]">*</span>
                      </label>
                      <select
                        id="excelSkill"
                        name="Microsoft Excel Skill Level"
                        required
                        value={formState.excelSkill}
                        onChange={(e) => updateField('excelSkill', e.target.value)}
                        className="block w-full min-h-[44px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white focus:outline-none focus:border-[#167d83] focus:ring-3 focus:ring-[#167d83]/12"
                      >
                        <option value="">Select level</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Basic">Basic</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="taxVat"
                        className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                      >
                        Knowledge of Tax &amp; VAT Procedures in Bangladesh{' '}
                        <span className="text-[#b5473c]">*</span>
                      </label>
                      <select
                        id="taxVat"
                        name="Tax and VAT Knowledge"
                        required
                        value={formState.taxVat}
                        onChange={(e) => updateField('taxVat', e.target.value)}
                        className="block w-full min-h-[44px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white focus:outline-none focus:border-[#167d83] focus:ring-3 focus:ring-[#167d83]/12"
                      >
                        <option value="">Select option</option>
                        <option value="Practical experience">Practical experience</option>
                        <option value="Theoretical knowledge">Theoretical knowledge</option>
                        <option value="Limited knowledge">Limited knowledge</option>
                        <option value="No prior knowledge, but willing to learn">
                          No prior knowledge, but willing to learn
                        </option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="skillsDetails"
                        className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                      >
                        Describe any relevant accounting or financial skills
                      </label>
                      <textarea
                        id="skillsDetails"
                        name="Relevant Accounting and Financial Skills"
                        rows={3}
                        value={formState.skillsDetails}
                        onChange={(e) => updateField('skillsDetails', e.target.value)}
                        placeholder="Mention relevant coursework, projects, tools, or practical skills."
                        className="block w-full min-h-[104px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white resize-y focus:outline-none focus:border-[#167d83] focus:ring-3 focus:ring-[#167d83]/12"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 04: Work Experience & Training */}
              <section
                className="bg-white border border-[#dfe6ec] rounded-[14px] shadow-sm overflow-hidden"
                aria-labelledby="experience-heading"
              >
                <div className="flex items-start gap-3.5 bg-[#fbfcfd] px-5 sm:px-6 py-5 border-b border-[#dfe6ec]">
                  <div className="grid place-items-center w-[34px] h-[34px] shrink-0 rounded-[10px] bg-[#e8f3f3] text-[#10666b] font-extrabold font-mono tabular-nums text-sm">
                    04
                  </div>
                  <div>
                    <h2
                      id="experience-heading"
                      className="text-[#10243a] text-[17px] font-bold leading-snug"
                    >
                      Work Experience &amp; Training
                    </h2>
                    <p className="text-[#68788a] text-[13px] mt-0.5">
                      Fresh graduates are welcome. If you do not have work experience, choose the relevant option.
                    </p>
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                    <div>
                      <label
                        htmlFor="workExperience"
                        className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                      >
                        Do you have previous work experience?{' '}
                        <span className="text-[#b5473c]">*</span>
                      </label>
                      <select
                        id="workExperience"
                        name="Previous Work Experience"
                        required
                        value={formState.workExperience}
                        onChange={(e) => handleWorkExperienceChange(e.target.value)}
                        className="block w-full min-h-[44px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white focus:outline-none focus:border-[#167d83] focus:ring-3 focus:ring-[#167d83]/12"
                      >
                        <option value="">Select option</option>
                        <option value="Full-time experience">Yes, full-time experience</option>
                        <option value="Part-time experience">Yes, part-time experience</option>
                        <option value="Internship or trainee experience only">
                          Internship / trainee experience only
                        </option>
                        <option value="No professional experience">
                          No professional experience
                        </option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="experienceLength"
                        className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                      >
                        Total Relevant Work Experience <span className="text-[#b5473c]">*</span>
                      </label>
                      <select
                        id="experienceLength"
                        name="Total Relevant Work Experience"
                        required
                        value={formState.experienceLength}
                        onChange={(e) => updateField('experienceLength', e.target.value)}
                        className="block w-full min-h-[44px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white focus:outline-none focus:border-[#167d83] focus:ring-3 focus:ring-[#167d83]/12"
                      >
                        <option value="">Select experience</option>
                        <option value="No experience">No experience</option>
                        <option value="Less than 1 year">Less than 1 year</option>
                        <option value="1–2 years">1–2 years</option>
                        <option value="3–5 years">3–5 years</option>
                        <option value="More than 5 years">More than 5 years</option>
                      </select>
                    </div>
                  </div>

                  {showWorkDetails && (
                    <div className="p-4 bg-[#f7f9fb] border border-[#e1e8ee] rounded-[10px]">
                      <p className="text-[#10243a] text-[13px] font-extrabold mb-3.5">
                        Previous / Current Employment Details
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                        <div>
                          <label
                            htmlFor="organization"
                            className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                          >
                            Previous / Current Organization
                          </label>
                          <input
                            id="organization"
                            name="Previous or Current Organization"
                            type="text"
                            value={formState.organization}
                            onChange={(e) => updateField('organization', e.target.value)}
                            placeholder="Organization name"
                            className="block w-full min-h-[44px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white focus:outline-none focus:border-[#167d83]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="jobTitle"
                            className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                          >
                            Job Title
                          </label>
                          <input
                            id="jobTitle"
                            name="Previous Job Title"
                            type="text"
                            value={formState.jobTitle}
                            onChange={(e) => updateField('jobTitle', e.target.value)}
                            placeholder="e.g. Accounts Assistant"
                            className="block w-full min-h-[44px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white focus:outline-none focus:border-[#167d83]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label
                            htmlFor="responsibilities"
                            className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                          >
                            Previous Role and Responsibilities
                          </label>
                          <textarea
                            id="responsibilities"
                            name="Previous Role and Responsibilities"
                            rows={3}
                            value={formState.responsibilities}
                            onChange={(e) => updateField('responsibilities', e.target.value)}
                            placeholder="Briefly describe your responsibilities and relevant achievements."
                            className="block w-full min-h-[104px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white resize-y focus:outline-none focus:border-[#167d83]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-[#f7f9fb] border border-[#e1e8ee] rounded-[10px]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                      <div>
                        <label
                          htmlFor="training"
                          className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                        >
                          Have you completed accounting-related internship or training?{' '}
                          <span className="text-[#b5473c]">*</span>
                        </label>
                        <select
                          id="training"
                          name="Accounting Internship or Training"
                          required
                          value={formState.training}
                          onChange={(e) => handleTrainingChange(e.target.value)}
                          className="block w-full min-h-[44px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white focus:outline-none focus:border-[#167d83]"
                        >
                          <option value="">Select option</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      {showTrainingDetails && (
                        <div className="sm:col-span-2">
                          <label
                            htmlFor="trainingDetails"
                            className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                          >
                            Internship / Training Details
                          </label>
                          <textarea
                            id="trainingDetails"
                            name="Internship or Training Details"
                            rows={3}
                            value={formState.trainingDetails}
                            onChange={(e) => updateField('trainingDetails', e.target.value)}
                            placeholder="Organization, duration, topics covered, or tasks performed."
                            className="block w-full min-h-[104px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white resize-y focus:outline-none focus:border-[#167d83]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 05: Employment Availability */}
              <section
                className="bg-white border border-[#dfe6ec] rounded-[14px] shadow-sm overflow-hidden"
                aria-labelledby="availability-heading"
              >
                <div className="flex items-start gap-3.5 bg-[#fbfcfd] px-5 sm:px-6 py-5 border-b border-[#dfe6ec]">
                  <div className="grid place-items-center w-[34px] h-[34px] shrink-0 rounded-[10px] bg-[#e8f3f3] text-[#10666b] font-extrabold font-mono tabular-nums text-sm">
                    05
                  </div>
                  <div>
                    <h2
                      id="availability-heading"
                      className="text-[#10243a] text-[17px] font-bold leading-snug"
                    >
                      Employment Availability
                    </h2>
                    <p className="text-[#68788a] text-[13px] mt-0.5">
                      Confirm that the role and work location fit your availability.
                    </p>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                    <div>
                      <label
                        htmlFor="fullTime"
                        className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                      >
                        Are you available for a full-time position?{' '}
                        <span className="text-[#b5473c]">*</span>
                      </label>
                      <select
                        id="fullTime"
                        name="Full-Time Availability"
                        required
                        value={formState.fullTime}
                        onChange={(e) => updateField('fullTime', e.target.value)}
                        className="block w-full min-h-[44px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white focus:outline-none focus:border-[#167d83]"
                      >
                        <option value="">Select option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="joinTime"
                        className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                      >
                        When can you join? <span className="text-[#b5473c]">*</span>
                      </label>
                      <select
                        id="joinTime"
                        name="Joining Availability"
                        required
                        value={formState.joinTime}
                        onChange={(e) => updateField('joinTime', e.target.value)}
                        className="block w-full min-h-[44px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white focus:outline-none focus:border-[#167d83]"
                      >
                        <option value="">Select option</option>
                        <option value="Immediately">Immediately</option>
                        <option value="Within 7 days">Within 7 days</option>
                        <option value="Within 15 days">Within 15 days</option>
                        <option value="Within 30 days">Within 30 days</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="officeLocation"
                        className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                      >
                        Willing to work from our Panthapath, Dhaka office?{' '}
                        <span className="text-[#b5473c]">*</span>
                      </label>
                      <select
                        id="officeLocation"
                        name="Willing to Work in Panthapath Dhaka"
                        required
                        value={formState.officeLocation}
                        onChange={(e) => updateField('officeLocation', e.target.value)}
                        className="block w-full min-h-[44px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white focus:outline-none focus:border-[#167d83]"
                      >
                        <option value="">Select option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="salary"
                        className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                      >
                        Expected Monthly Salary (BDT) <span className="text-[#b5473c]">*</span>
                      </label>
                      <input
                        id="salary"
                        name="Expected Monthly Salary BDT"
                        type="number"
                        min="0"
                        step="500"
                        required
                        value={formState.salary}
                        onChange={(e) => updateField('salary', e.target.value)}
                        placeholder="Enter amount in BDT"
                        className="block w-full min-h-[44px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white font-mono tabular-nums focus:outline-none focus:border-[#167d83]"
                      />
                      <span className="block text-[#68788a] text-xs mt-1">
                        Enter your expected gross monthly salary in Bangladeshi Taka.
                      </span>
                    </div>

                    <div>
                      <label
                        htmlFor="noticePeriod"
                        className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                      >
                        Are you currently serving a notice period?
                      </label>
                      <select
                        id="noticePeriod"
                        name="Currently Serving Notice Period"
                        value={formState.noticePeriod}
                        onChange={(e) => updateField('noticePeriod', e.target.value)}
                        className="block w-full min-h-[44px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white focus:outline-none focus:border-[#167d83]"
                      >
                        <option value="">Select option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="Not applicable">Not applicable</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 06: CV & Supporting Documents */}
              <section
                className="bg-white border border-[#dfe6ec] rounded-[14px] shadow-sm overflow-hidden"
                aria-labelledby="documents-heading"
              >
                <div className="flex items-start gap-3.5 bg-[#fbfcfd] px-5 sm:px-6 py-5 border-b border-[#dfe6ec]">
                  <div className="grid place-items-center w-[34px] h-[34px] shrink-0 rounded-[10px] bg-[#e8f3f3] text-[#10666b] font-extrabold font-mono tabular-nums text-sm">
                    06
                  </div>
                  <div>
                    <h2
                      id="documents-heading"
                      className="text-[#10243a] text-[17px] font-bold leading-snug"
                    >
                      CV &amp; Supporting Documents
                    </h2>
                    <p className="text-[#68788a] text-[13px] mt-0.5">
                      Attach your updated CV and share any relevant profile or work sample.
                    </p>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-y-5">
                    <div>
                      <label
                        htmlFor="cv"
                        className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                      >
                        Upload Updated CV / Resume (PDF) <span className="text-[#b5473c]">*</span>
                      </label>
                      <input
                        ref={cvInputRef}
                        id="cv"
                        name="CV File"
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={handleCvFileChange}
                        className="w-full border border-dashed border-[#b9c8d4] rounded-lg bg-[#f7f9fb] p-3 text-[#68788a] text-xs cursor-pointer"
                      />
                      <span className="block text-[#68788a] text-xs mt-1">
                        PDF only · Maximum 10 MB. Validated locally in your browser.
                      </span>
                      {cvError && (
                        <div className="text-[#b42318] text-xs font-semibold mt-1" aria-live="polite">
                          {cvError}
                        </div>
                      )}
                      {!cvError && cvFile && (
                        <div
                          className="text-[#16734b] text-xs font-mono tabular-nums font-semibold mt-1 flex items-center gap-1.5"
                          aria-live="polite"
                        >
                          <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Selected: {cvFile.fileName} ({formatBytes(cvFile.sizeBytes)})
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="academicDocs"
                        className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                      >
                        Academic Transcript / Certificate (Optional)
                      </label>
                      <input
                        ref={docsInputRef}
                        id="academicDocs"
                        name="Academic Documents"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        multiple
                        onChange={handleAcademicDocsChange}
                        className="w-full border border-dashed border-[#b9c8d4] rounded-lg bg-[#f7f9fb] p-3 text-[#68788a] text-xs cursor-pointer"
                      />
                      <span className="block text-[#68788a] text-xs mt-1">
                        PDF, JPG or PNG · Maximum 10 MB per file. Listed by filename in the JSON/PDF export.
                      </span>
                      {docsError && (
                        <div className="text-[#b42318] text-xs font-semibold mt-1" aria-live="polite">
                          {docsError}
                        </div>
                      )}
                      {!docsError && academicDocs.length > 0 && (
                        <div
                          className="text-[#16734b] text-xs font-mono tabular-nums font-semibold mt-1"
                          aria-live="polite"
                        >
                          {academicDocs
                            .map((f) => `${f.fileName} (${formatBytes(f.sizeBytes)})`)
                            .join(' · ')}
                        </div>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="portfolio"
                        className="block text-[#293b4e] font-bold text-[13px] mb-1.5"
                      >
                        Portfolio / Relevant Work Sample / LinkedIn URL
                      </label>
                      <input
                        id="portfolio"
                        name="Portfolio or Work Sample URL"
                        type="url"
                        value={formState.portfolio}
                        onChange={(e) => updateField('portfolio', e.target.value)}
                        placeholder="https://..."
                        className="block w-full min-h-[44px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white focus:outline-none focus:border-[#167d83]"
                      />
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <label
                          htmlFor="motivation"
                          className="block text-[#293b4e] font-bold text-[13px]"
                        >
                          Why do you want to join E-Lawyers as an Accountant?{' '}
                          <span className="text-[#b5473c]">*</span>
                        </label>
                        <span
                          className={`text-xs font-mono tabular-nums ${
                            formState.motivation.trim().length >= 20
                              ? 'text-[#16734b] font-semibold'
                              : 'text-[#68788a]'
                          }`}
                        >
                          {formState.motivation.trim().length} / 20+ chars
                        </span>
                      </div>
                      <textarea
                        id="motivation"
                        name="Motivation to Join E-Lawyers"
                        rows={4}
                        value={formState.motivation}
                        onChange={(e) => updateField('motivation', e.target.value)}
                        placeholder="Tell us about your interest in accounting, what you can contribute, and what you hope to learn."
                        className="block w-full min-h-[104px] px-3 py-2.5 text-[#243446] border border-[#ccd6df] rounded-lg bg-white resize-y focus:outline-none focus:border-[#167d83]"
                      />
                      <span className="block text-[#68788a] text-xs mt-1">
                        Briefly share your interest in joining E-Lawyers.
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 07: Declaration & Consent */}
              <section
                className="bg-white border border-[#dfe6ec] rounded-[14px] shadow-sm overflow-hidden"
                aria-labelledby="declaration-heading"
              >
                <div className="flex items-start gap-3.5 bg-[#fbfcfd] px-5 sm:px-6 py-5 border-b border-[#dfe6ec]">
                  <div className="grid place-items-center w-[34px] h-[34px] shrink-0 rounded-[10px] bg-[#e8f3f3] text-[#10666b] font-extrabold font-mono tabular-nums text-sm">
                    07
                  </div>
                  <div>
                    <h2
                      id="declaration-heading"
                      className="text-[#10243a] text-[17px] font-bold leading-snug"
                    >
                      Declaration &amp; Consent
                    </h2>
                    <p className="text-[#68788a] text-[13px] mt-0.5">
                      Please review and confirm the statements below.
                    </p>
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-3">
                  <label
                    className={`flex items-start gap-2.5 px-3.5 py-3 border rounded-lg text-[13px] font-medium cursor-pointer transition-colors ${
                      formState.declarationAccuracy
                        ? 'border-[#167d83] bg-[#f4fbfb] text-[#10243a]'
                        : 'border-[#dfe6ec] bg-white hover:border-[#9bc7c8]'
                    }`}
                  >
                    <input
                      id="declarationAccuracy"
                      type="checkbox"
                      name="Accuracy Declaration"
                      value="Agreed"
                      required
                      checked={formState.declarationAccuracy}
                      onChange={(e) => updateField('declarationAccuracy', e.target.checked)}
                      className="mt-0.5 accent-[#167d83] shrink-0"
                    />
                    <span>
                      I confirm that the information provided in this application is accurate and complete.{' '}
                      <span className="text-[#b5473c]">*</span>
                    </span>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 px-3.5 py-3 border rounded-lg text-[13px] font-medium cursor-pointer transition-colors ${
                      formState.declarationContact
                        ? 'border-[#167d83] bg-[#f4fbfb] text-[#10243a]'
                        : 'border-[#dfe6ec] bg-white hover:border-[#9bc7c8]'
                    }`}
                  >
                    <input
                      id="declarationContact"
                      type="checkbox"
                      name="Contact Consent"
                      value="Agreed"
                      required
                      checked={formState.declarationContact}
                      onChange={(e) => updateField('declarationContact', e.target.checked)}
                      className="mt-0.5 accent-[#167d83] shrink-0"
                    />
                    <span>
                      I understand that E-Lawyers may contact me regarding this application.{' '}
                      <span className="text-[#b5473c]">*</span>
                    </span>
                  </label>
                </div>
              </section>

              {/* Inline Error Notice Near Submit Bar */}
              {errorSummary && (
                <div
                  className="border border-[#f0b6b1] text-[#85251d] rounded-xl bg-[#fff7f6] px-4 py-3.5 text-[13px] space-y-1.5 print:hidden"
                  role="alert"
                >
                  <div className="flex items-start gap-2.5 font-bold">
                    <AlertCircle className="w-4 h-4 text-[#b42318] shrink-0 mt-0.5" />
                    <span>{errorSummary}</span>
                  </div>
                  {missingFieldsList.length > 0 && (
                    <div className="pl-6 text-xs text-[#85251d]">
                      <span className="font-semibold">Missing fields: </span>
                      <span>{missingFieldsList.join(' · ')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Form Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-[#68788a] text-xs flex-1 min-w-[220px]">
                  Required fields are marked with <span className="text-[#b5473c]">*</span>. Check all details before generating your application preview.
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {confirmClearOpen ? (
                    <div className="flex items-center gap-2 bg-white border border-[#dfe6ec] px-3 py-1.5 rounded-lg">
                      <span className="text-xs font-semibold text-[#85251d]">
                        Clear all entries?
                      </span>
                      <button
                        type="button"
                        onClick={handleConfirmClearForm}
                        className="px-2.5 py-1 rounded bg-[#b42318] text-white text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Yes, Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearOpen(false)}
                        className="px-2.5 py-1 rounded bg-[#e9eef3] text-[#10243a] text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      id="resetButton"
                      onClick={() => setConfirmClearOpen(true)}
                      className="px-4 py-3 rounded-[9px] bg-[#e9eef3] hover:bg-[#dce5ec] text-[#10243a] font-bold text-[13px] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear Form</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    className="px-4 py-3 rounded-[9px] bg-white border border-[#cbd6df] hover:bg-[#f7f9fb] text-[#10243a] font-bold text-[13px] shadow-sm inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-[#167d83]" />
                    <span>Generate Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSubmitApplicationAndNotifyHr()}
                    disabled={isSubmittingApplication}
                    className="px-5 py-3 rounded-[9px] bg-[#10243a] hover:bg-[#193650] text-white font-bold text-[13px] shadow-sm inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isSubmittingApplication ? (
                      <>
                        <Loader2 className="w-4 h-4 text-[#ddc38f] animate-spin" />
                        <span>Notifying HR Desk...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-[#ddc38f]" />
                        <span>Submit &amp; Notify HR</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Application Preview & HR Notification Receipt Card */}
            {isPreviewVisible && (
              <section
                ref={resultCardRef}
                id="resultCard"
                aria-labelledby="preview-heading"
                aria-live="polite"
                className="mt-6 bg-white border border-[#dfe6ec] rounded-[14px] shadow-sm p-5 sm:p-6 print:border-0 print:shadow-none print:p-0"
              >
                {/* Official HR Submission Confirmation Banner */}
                {isSubmittedToHr ? (
                  <div className="mb-6 rounded-xl overflow-hidden border border-[#b7e4c7] bg-[#f0fdf4] shadow-sm print:hidden">
                    <div className="bg-gradient-to-r from-[#10243a] via-[#173d4d] to-[#167d83] p-4 sm:p-5 text-white flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#c7a76b]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#16734b]/80 border border-[#b7e4c7]/40 grid place-items-center shrink-0">
                          <CheckCircle2 className="w-6 h-6 text-[#a7f3d0]" />
                        </div>
                        <div>
                          <div className="text-[#ddc38f] text-[11px] font-bold uppercase tracking-wider">
                            Accounts Division Recruitment Registry
                          </div>
                          <h3 className="text-lg font-bold text-white leading-tight">
                            Application Submitted &amp; HR Team Notified
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-black/25 px-3 py-1.5 rounded-lg border border-white/15">
                        <span className="text-xs text-[#c5d5df]">Docket ID:</span>
                        <span className="font-mono font-bold text-sm text-[#ddc38f]">
                          {applicationRefId}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyRefId}
                          title="Copy Reference ID"
                          className="ml-1 p-1 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                        >
                          {copiedRefId ? (
                            <Check className="w-3.5 h-3.5 text-[#a7f3d0]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 text-[13px] space-y-3.5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white p-3.5 rounded-lg border border-[#d1fae5] space-y-1">
                          <div className="flex items-center gap-1.5 text-[#16734b] font-bold text-xs uppercase tracking-wide">
                            <Mail className="w-3.5 h-3.5" />
                            <span>HR Notification Dispatch</span>
                          </div>
                          <div className="text-[#243446]">
                            Sent to: <strong className="font-semibold text-[#10243a]">career@elawyersbd.com</strong>
                          </div>
                          <div className="text-[#526276] text-xs">
                            CC: <span className="font-mono">ekram.elawyersbd@gmail.com</span>
                          </div>
                          <div className="text-[#16734b] text-[11.5px] font-medium flex items-center gap-1 pt-0.5">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Recruitment Desk Alert Dispatched Successfully</span>
                          </div>
                        </div>

                        <div className="bg-white p-3.5 rounded-lg border border-[#d1fae5] space-y-1">
                          <div className="flex items-center gap-1.5 text-[#16734b] font-bold text-xs uppercase tracking-wide">
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>Candidate Copy &amp; Gateway</span>
                          </div>
                          <div className="text-[#243446]">
                            Applicant: <strong className="font-semibold text-[#10243a]">{formState.email}</strong>
                          </div>
                          <div className="text-[#526276] text-xs">
                            Transport: {submissionReceipt?.emailTransport || 'E-Lawyers Mailer Hub'}
                          </div>
                          <div className="text-[#16734b] text-[11.5px] font-medium flex items-center gap-1 pt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Receipt Logged in Server Registry</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#fcfdfd] border border-[#e2e8f0] p-3 rounded-lg flex items-start gap-2 text-xs text-[#4a5568]">
                        <Clock className="w-4 h-4 text-[#167d83] shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-[#10243a]">Next Recruitment Stage:</strong>{' '}
                          Our HR and Accounts Division leads screen all applications within 2–4 business days. Shortlisted candidates are invited for an in-person assessment and interview at our Panthapath, Dhaka chamber.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#dfe6ec]">
                    <div>
                      <div className="flex items-center gap-2 text-[#16734b] text-xs font-bold mb-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>All Required Fields &amp; Minimum Selections Validated</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums text-[#10243a]">
                          {applicationRefId}
                        </span>
                      </div>
                      <h2 id="preview-heading" className="text-[#10243a] text-xl font-bold">
                        Application Preview
                      </h2>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-3 print:hidden">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#68788a]">
                    Structured Candidate Summary
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#68788a]">Reference:</span>
                    <span className="font-mono text-xs font-bold text-[#10243a] bg-[#f2f5f8] px-2 py-0.5 rounded">
                      {applicationRefId}
                    </span>
                  </div>
                </div>

                <div
                  id="previewContent"
                  className="border border-[#dfe6ec] rounded-[9px] overflow-hidden divide-y divide-[#dfe6ec]"
                >
                  {previewRows.map((row) => (
                    <div
                      key={row.keyLabel}
                      className="grid grid-cols-1 sm:grid-cols-[minmax(190px,0.7fr)_1.3fr] print:break-inside-avoid"
                    >
                      <div className="bg-[#f7f9fb] text-[#526276] font-bold text-[13px] px-3.5 py-2.5">
                        {row.keyLabel}
                      </div>
                      <div className="text-[#243446] text-[13px] px-3.5 py-2.5 whitespace-pre-wrap break-words font-mono tabular-nums">
                        {row.valueText}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Primary Result Actions: Download JSON | Print / Save as PDF | Submit to HR | Back to Form | Clear Form */}
                <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-[#dfe6ec] print:hidden">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      id="downloadJson"
                      onClick={handleDownloadJson}
                      className="px-4 py-3 rounded-[9px] bg-[#167d83] hover:bg-[#10666b] text-white font-bold text-[13px] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Application Data (.json)</span>
                    </button>

                    <button
                      type="button"
                      id="printPreview"
                      onClick={handlePrintAndSavePdf}
                      className="px-4 py-3 rounded-[9px] bg-white border border-[#cbd6df] hover:bg-[#f7f9fb] text-[#10243a] font-bold text-[13px] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors shadow-sm"
                    >
                      <Printer className="w-4 h-4 text-[#167d83]" />
                      <span>Print / Save as PDF</span>
                    </button>

                    {!isSubmittedToHr ? (
                      <button
                        type="button"
                        onClick={() => handleSubmitApplicationAndNotifyHr()}
                        disabled={isSubmittingApplication}
                        className="px-4 py-3 rounded-[9px] bg-[#10243a] hover:bg-[#193650] text-white font-bold text-[13px] inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 transition-colors shadow-sm disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        {isSubmittingApplication ? (
                          <>
                            <Loader2 className="w-4 h-4 text-[#ddc38f] animate-spin" />
                            <span>Notifying HR...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5 text-[#ddc38f]" />
                            <span>Submit to E-Lawyers HR</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCopyRefId}
                        className="px-4 py-3 rounded-[9px] bg-[#ecfdf3] border border-[#b7e4c7] text-[#16734b] font-bold text-[13px] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                      >
                        {copiedRefId ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        <span>{copiedRefId ? 'Reference ID Copied' : 'Copy Reference ID'}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      id="editApplication"
                      onClick={handleEditApplication}
                      className="px-4 py-3 rounded-[9px] bg-[#e9eef3] hover:bg-[#dce5ec] text-[#10243a] font-bold text-[13px] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Form</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmClearForm}
                      className="px-4 py-3 rounded-[9px] border border-[#f0b6b1] bg-[#fff7f6] hover:bg-[#ffeae8] text-[#85251d] font-bold text-[13px] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear Form</span>
                    </button>
                  </div>
                </div>

                <p className="text-[#68788a] text-xs mt-3.5 print:hidden">
                  The JSON and PDF exports include your entered text, selected competencies, application reference ID ({applicationRefId}), and the filenames of attached documents.
                </p>
              </section>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-[#728194] text-xs pt-8 pb-2 print:hidden">
          <strong className="text-[#10243a]">
            E-Lawyers Legal &amp; Business Consultancy Firm
          </strong>
          <br />
          G-5, BTI Centara Grand, 144-144/1 Green Road, Panthapath, Dhaka-1205, Bangladesh
        </footer>
      </main>
    </div>
  );
};
