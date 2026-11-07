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
  Send,
  Calendar,
  MapPin,
  Users,
  Clock,
  Mail,
  Phone,
  Check,
  ChevronRight,
  ChevronDown,
  Sparkles,
  BookOpen,
  Laptop,
  GraduationCap,
  Award,
  Copy,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Layers,
  Compass,
  FileCheck2,
  TrendingUp,
  Target,
  Megaphone,
  Share2,
  DollarSign,
  X
} from 'lucide-react';
import type { CareerApplicationData } from '../utils/careerEmailTemplate';
import { submitCareerApplicationToApi } from '../utils/careerStorage';

interface FileMeta {
  fileName: string;
  fileType: string;
  sizeBytes: number;
}

export interface SalesMarketingFormState {
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
  salesMarketingSkills: string[];
  leadGenChannels: string[];
  negotiationRating: string;
  excelSkill: string;
  socialMediaSkill: string;
  spokenBengaliFluency: string;
  spokenEnglishFluency: string;
  workExperience: string;
  experienceLength: string;
  organization: string;
  jobTitle: string;
  responsibilities: string;
  salesAchievements: string;
  fullTime: string;
  joinTime: string;
  officeLocation: string;
  salary: string;
  incentiveExpectation: string;
  noticePeriod: string;
  portfolio: string;
  motivation: string;
  declarationAccuracy: boolean;
  declarationContact: boolean;
}

const DRAFT_STORAGE_KEY = 'elaw_career_sales_marketing_draft_v1';

const INITIAL_FORM_STATE: SalesMarketingFormState = {
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
  salesMarketingSkills: [],
  leadGenChannels: [],
  negotiationRating: '4',
  excelSkill: 'Intermediate',
  socialMediaSkill: 'Proficient',
  spokenBengaliFluency: 'Native / Fluent (মাতৃভাষা/সাবলীল)',
  spokenEnglishFluency: 'Conversational (কথোপকথন উপযোগী)',
  workExperience: 'Fresh Graduate',
  experienceLength: '',
  organization: '',
  jobTitle: '',
  responsibilities: '',
  salesAchievements: '',
  fullTime: 'Yes',
  joinTime: 'Immediately (তাৎক্ষণিক)',
  officeLocation: 'Yes',
  salary: '',
  incentiveExpectation: 'Open to standard performance incentive scheme',
  noticePeriod: '',
  portfolio: '',
  motivation: '',
  declarationAccuracy: false,
  declarationContact: false
};

const SAMPLE_FORM_STATE: SalesMarketingFormState = {
  fullName: 'Shahriar Kabir Rifat',
  email: 'shahriar.kabir.sales@gmail.com',
  phone: '+880 1712-493821',
  whatsapp: '+880 1712-493821',
  address: 'Green Corner, 23/A Panthapath Road, Dhaka-1205',
  location: 'Panthapath, Dhaka',
  linkedin: 'https://linkedin.com/in/shahriar-kabir-sales',
  highestQualification: "Bachelor's Degree (স্নাতক / সমমান)",
  degreeProgram: 'BBA in Marketing / Business Administration',
  major: 'Marketing & Strategic Sales',
  institution: 'BRAC University / East West University',
  graduationYear: '2025',
  academicResult: 'CGPA 3.62 out of 4.00',
  currentlyStudying: 'No (Completed all academic requirements)',
  salesMarketingSkills: [
    'B2B Corporate Client Acquisition',
    'Cold Calling & Tele-Marketing',
    'Lead Generation & Prospecting',
    'Client Relationship Management (CRM)',
    'Negotiation & Deal Closing',
    'Social Media Marketing & Campaigns'
  ],
  leadGenChannels: [
    'Direct Corporate Visits & In-Person Pitching',
    'Telephone Outreach & Tele-Marketing',
    'LinkedIn B2B Outreach',
    'WhatsApp Business Messaging & CRM',
    'Email Marketing & Follow-up Sequences'
  ],
  negotiationRating: '5',
  excelSkill: 'Intermediate (Sales Tracking, Client Data Lists)',
  socialMediaSkill: 'Advanced (LinkedIn, Facebook Pages, Meta Ads)',
  spokenBengaliFluency: 'Native / Fluent (মাতৃভাষা/সাবলীল)',
  spokenEnglishFluency: 'Fluent / Professional (পেশাদার মানের)',
  workExperience: 'Fresh Graduate with Internship (ইন্টার্নশিপ সম্পন্ন)',
  experienceLength: '6 Months Sales Internship',
  organization: 'Apex Corporate Solutions Ltd.',
  jobTitle: 'Business Development & Sales Executive Intern',
  responsibilities:
    'Generated 40+ prospective B2B corporate leads monthly, scheduled initial client discovery meetings, and prepared proposal pitch decks.',
  salesAchievements:
    'Exceeded monthly outreach target by 25% and assisted in closing 8 SME corporate compliance contracts.',
  fullTime: 'Yes',
  joinTime: 'Immediately (তাৎক্ষণিক)',
  officeLocation: 'Yes',
  salary: 'Negotiable (BDT 25,000 - 32,000 base + performance commission)',
  incentiveExpectation: 'Performance-driven target commission policy',
  noticePeriod: 'Available to start within 3 days',
  portfolio: 'https://linkedin.com/in/shahriar-kabir-sales',
  motivation:
    'I thrive on connecting business owners and entrepreneurs with high-impact professional services. E-Lawyers has a stellar reputation in taxation, corporate law, and business consultancy. I am eager to leverage my communication, networking, and persuasion abilities to expand the firm’s clientele across Dhaka and nationwide.',
  declarationAccuracy: true,
  declarationContact: true
};

const SALES_SKILLS_OPTIONS = [
  { id: 'b2b', value: 'B2B Corporate Client Acquisition', label: 'B2B Corporate Client Acquisition', bn: 'কর্পোরেট ক্লায়েন্ট সংগ্রহ' },
  { id: 'tele', value: 'Cold Calling & Tele-Marketing', label: 'Cold Calling & Tele-Marketing', bn: 'টেলি-মার্কেটিং ও ফোন যোগাযোগ' },
  { id: 'lead', value: 'Lead Generation & Prospecting', label: 'Lead Generation & Prospecting', bn: 'নতুন কাস্টমার অনুসন্ধান ও লিড তৈরি' },
  { id: 'crm', value: 'Client Relationship Management (CRM)', label: 'Client Relationship Management (CRM)', bn: 'ক্লায়েন্ট সম্পর্ক ও ডেটাবেজ ম্যানেজমেন্ট' },
  { id: 'close', value: 'Negotiation & Deal Closing', label: 'Negotiation & Deal Closing', bn: 'নেগোসিয়েশন ও ক্লায়েন্ট কনভার্শন' },
  { id: 'social', value: 'Social Media Marketing & Campaigns', label: 'Social Media Marketing & Campaigns', bn: 'সোশ্যাল মিডিয়া প্রচার ও ব্র্যান্ডিং' }
];

const LEAD_GEN_OPTIONS = [
  { id: 'direct', value: 'Direct Corporate Visits & In-Person Pitching', label: 'Direct Corporate Visits & In-Person Pitching' },
  { id: 'phone', value: 'Telephone Outreach & Tele-Marketing', label: 'Telephone Outreach & Tele-Marketing' },
  { id: 'linkedin', value: 'LinkedIn B2B Outreach', label: 'LinkedIn B2B Outreach' },
  { id: 'whatsapp', value: 'WhatsApp Business Messaging & CRM', label: 'WhatsApp Business Messaging & CRM' },
  { id: 'email', value: 'Email Marketing & Follow-up Sequences', label: 'Email Marketing & Follow-up Sequences' }
];

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB limit

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

type TabMode = 'circular' | 'apply';

export const CareerSalesMarketingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'apply' ? 'apply' : 'circular';
  const [activeTab, setActiveTab] = useState<TabMode>(initialTab);

  const [formState, setFormState] = useState<SalesMarketingFormState>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.formState) {
          return { ...INITIAL_FORM_STATE, ...parsed.formState };
        }
      }
    } catch {
      // storage unavailable
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
      // storage unavailable
    }
    return null;
  });

  const [academicDocs, setAcademicDocs] = useState<FileMeta[]>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.academicDocs)) return parsed.academicDocs;
      }
    } catch {
      // storage unavailable
    }
    return [];
  });

  const [cvError, setCvError] = useState<string>('');
  const [docsError, setDocsError] = useState<string>('');
  const [errorSummary, setErrorSummary] = useState<string>('');
  const [missingFieldsList, setMissingFieldsList] = useState<string[]>([]);
  const [actionFeedback, setActionFeedback] = useState<string>('');
  const [applicationRefId, setApplicationRefId] = useState<string>('');
  const [generatedAtLabel, setGeneratedAtLabel] = useState<string>('');
  const [generatedIso, setGeneratedIso] = useState<string>('');
  const [isPreviewVisible, setIsPreviewVisible] = useState<boolean>(false);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState<boolean>(false);
  const [isSubmittedToHr, setIsSubmittedToHr] = useState<boolean>(false);

  const [openSections, setOpenSections] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
    7: true,
    8: true
  });

  const toggleSection = (sectionIndex: number) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex]
    }));
  };

  const expandAllSections = () => {
    setOpenSections({ 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true });
  };

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
  const previewCardRef = useRef<HTMLDivElement | null>(null);
  const resultCardRef = useRef<HTMLDivElement | null>(null);
  const cvInputRef = useRef<HTMLInputElement | null>(null);
  const docsInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          formState,
          cvFile,
          academicDocs,
          savedAt: new Date().toISOString()
        })
      );
    } catch {
      // storage unavailable
    }
  }, [formState, cvFile, academicDocs]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'apply' && activeTab !== 'apply') {
      setActiveTab('apply');
    } else if (tabParam === 'circular' && activeTab !== 'circular') {
      setActiveTab('circular');
    }
  }, [searchParams]);

  const handleTabChange = (mode: TabMode) => {
    setActiveTab(mode);
    setSearchParams(mode === 'apply' ? { tab: 'apply' } : {});
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const showActionFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => {
      setActionFeedback('');
    }, 4500);
  };

  const handleInputChange = <K extends keyof SalesMarketingFormState>(
    field: K,
    value: SalesMarketingFormState[K]
  ) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleToggleSkill = (skillValue: string) => {
    setFormState(prev => {
      const exists = prev.salesMarketingSkills.includes(skillValue);
      const updated = exists
        ? prev.salesMarketingSkills.filter(s => s !== skillValue)
        : [...prev.salesMarketingSkills, skillValue];
      return { ...prev, salesMarketingSkills: updated };
    });
  };

  const handleToggleLeadChannel = (channelValue: string) => {
    setFormState(prev => {
      const exists = prev.leadGenChannels.includes(channelValue);
      const updated = exists
        ? prev.leadGenChannels.filter(c => c !== channelValue)
        : [...prev.leadGenChannels, channelValue];
      return { ...prev, leadGenChannels: updated };
    });
  };

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCvError('');
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const lowerName = file.name.toLowerCase();

    if (file.size > MAX_FILE_BYTES) {
      setCvError(`File size exceeds 10MB limit (${formatBytes(file.size)}). Please attach a smaller file.`);
      return;
    }

    if (!allowedExtensions.some(ext => lowerName.endsWith(ext))) {
      setCvError('Unsupported file type. Please upload a PDF, DOC, or DOCX document.');
      return;
    }

    setCvFile({
      fileName: file.name,
      fileType: file.type || 'application/pdf',
      sizeBytes: file.size
    });
    showActionFeedback(`Attached CV: ${file.name}`);
  };

  const handleDocsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocsError('');
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;

    const validNewDocs: FileMeta[] = [];
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const rejectedMessages: string[] = [];

    for (const f of files) {
      if (f.size > MAX_FILE_BYTES) {
        rejectedMessages.push(`"${f.name}" exceeds the 10MB limit and was skipped.`);
        continue;
      }

      const lowerName = f.name.toLowerCase();
      if (!allowedExtensions.some(ext => lowerName.endsWith(ext))) {
        rejectedMessages.push(`"${f.name}" is not a supported file type. Use PDF, DOC, DOCX, or Image.`);
        continue;
      }

      validNewDocs.push({
        fileName: f.name,
        fileType: f.type || 'application/pdf',
        sizeBytes: f.size
      });
    }

    if (validNewDocs.length > 0) {
      setAcademicDocs(prev => [...prev, ...validNewDocs]);
      showActionFeedback(`Added ${validNewDocs.length} supporting document(s).`);
    }
    if (rejectedMessages.length > 0) {
      setDocsError(rejectedMessages.join(' '));
    }
    if (docsInputRef.current) docsInputRef.current.value = '';
  };

  const removeDoc = (index: number) => {
    setAcademicDocs(prev => prev.filter((_, i) => i !== index));
    showActionFeedback('Document removed.');
  };

  const handleClearForm = () => {
    setFormState(INITIAL_FORM_STATE);
    setCvFile(null);
    setAcademicDocs([]);
    setCvError('');
    setDocsError('');
    setErrorSummary('');
    setMissingFieldsList([]);
    setIsPreviewVisible(false);
    setIsSubmittedToHr(false);
    setSubmissionReceipt(null);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
    if (cvInputRef.current) cvInputRef.current.value = '';
    if (docsInputRef.current) docsInputRef.current.value = '';
    showActionFeedback('Form reset to blank state.');
  };

  const formProgress = useMemo(() => {
    const requiredCheckpoints = [
      Boolean(formState.fullName.trim()),
      Boolean(formState.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())),
      Boolean(formState.phone.trim()),
      Boolean(formState.address.trim()),
      Boolean(formState.location.trim()),
      Boolean(formState.highestQualification),
      Boolean(formState.degreeProgram.trim()),
      Boolean(formState.institution.trim()),
      Boolean(formState.graduationYear),
      formState.salesMarketingSkills.length >= 1,
      Boolean(formState.spokenBengaliFluency),
      Boolean(formState.spokenEnglishFluency),
      Boolean(formState.workExperience),
      Boolean(formState.fullTime),
      Boolean(formState.joinTime),
      Boolean(formState.officeLocation),
      Boolean(formState.salary.trim()),
      Boolean(cvFile),
      Boolean(formState.motivation.trim()),
      Boolean(formState.declarationAccuracy),
      Boolean(formState.declarationContact)
    ];

    const completed = requiredCheckpoints.filter(Boolean).length;
    const total = requiredCheckpoints.length;
    return Math.round((completed / total) * 100);
  }, [formState, cvFile]);

  const validateAllRequiredFields = (): string[] => {
    const missing: string[] = [];

    if (!formState.fullName.trim()) missing.push('Full Name (পূর্ণ নাম)');
    if (!formState.email.trim()) {
      missing.push('Email Address (ইমেইল)');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) {
      missing.push('Valid Email Address format (সঠিক ইমেইল ফরম্যাট)');
    }
    if (!formState.phone.trim()) missing.push('Contact Number (মোবাইল নম্বর)');
    if (!formState.address.trim()) missing.push('Present Address (বর্তমান ঠিকানা)');
    if (!formState.location.trim()) missing.push('Current City / Area (বর্তমান শহর/এলাকা)');

    if (!formState.highestQualification) missing.push('Highest Educational Level (সর্বোচ্চ শিক্ষাগত যোগ্যতা)');
    if (!formState.degreeProgram.trim()) missing.push('Degree / Discipline (ডিগ্রি বা অনুষদ: BBA, Marketing, Management, etc.)');
    if (!formState.institution.trim()) missing.push('University / College Institution Name (শিক্ষা প্রতিষ্ঠান)');
    if (!formState.graduationYear) missing.push('Passing / Graduation Year (পাসের সাল)');

    if (!formState.salary.trim()) missing.push('Expected Monthly Salary / Stipend (বেতন প্রত্যাশা)');
    if (cvError) missing.push('Valid CV / Resume attachment (সিভি বা রেজ্যুমে)');

    if (!formState.declarationAccuracy) missing.push('Accuracy Declaration checkbox (তথ্য সঠিকতার ঘোষণা)');
    if (!formState.declarationContact) missing.push('Interview Contact Permission checkbox (যোগাযোগের সম্মতি)');

    return missing;
  };

  const triggerError = (msg: string, list: string[] = []) => {
    expandAllSections();
    setErrorSummary(msg);
    setMissingFieldsList(list);
    window.scrollTo({ top: 460, behavior: 'smooth' });
  };

  const handleFillSample = () => {
    setFormState(SAMPLE_FORM_STATE);
    setCvFile({
      fileName: 'Shahriar_Kabir_Rifat_Sales_CV.pdf',
      fileType: 'application/pdf',
      sizeBytes: 490000
    });
    setAcademicDocs([
      { fileName: 'BBA_Marketing_Certificate_Shahriar.pdf', fileType: 'application/pdf', sizeBytes: 780000 },
      { fileName: 'Digital_Marketing_Sales_Training.pdf', fileType: 'application/pdf', sizeBytes: 320000 }
    ]);
    setCvError('');
    setDocsError('');
    setErrorSummary('');
    setMissingFieldsList([]);
    expandAllSections();
    showActionFeedback('Sample Sales & Marketing profile loaded! You can now review, generate PDF, or submit.');
  };

  const handleGeneratePreview = () => {
    setErrorSummary('');
    setMissingFieldsList([]);

    const missing = validateAllRequiredFields();
    if (missing.length > 0) {
      if (!cvFile && !cvError) {
        setCvError('Please attach your updated CV / Resume (PDF).');
      }
      triggerError(
        'Please complete all required fields highlighted below before generating your application preview.',
        missing
      );
      return;
    }

    const now = new Date();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ref = `ELAW-SME-${now.getFullYear()}-${randomSuffix}`;
    setApplicationRefId(ref);
    setGeneratedAtLabel(now.toLocaleString());
    setGeneratedIso(now.toISOString());
    setIsPreviewVisible(true);
    setIsSubmittedToHr(false);

    showActionFeedback(`Official preview generated with Reference ID: ${ref}`);

    setTimeout(() => {
      previewCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const previewRows = useMemo(() => {
    return [
      { section: 'Reference & Status', keyLabel: 'Application Reference ID', valueText: applicationRefId || 'Pending' },
      { section: 'Reference & Status', keyLabel: 'Target Position', valueText: 'Sales & Marketing Executive' },
      { section: 'Reference & Status', keyLabel: 'Target Department', valueText: 'Sales & Marketing Division' },
      { section: 'Personal Information', keyLabel: 'Full Legal Name', valueText: formState.fullName },
      { section: 'Personal Information', keyLabel: 'Email Address', valueText: formState.email },
      { section: 'Personal Information', keyLabel: 'Primary Contact Number', valueText: formState.phone },
      { section: 'Personal Information', keyLabel: 'WhatsApp Number', valueText: formState.whatsapp || 'Same as primary' },
      { section: 'Personal Information', keyLabel: 'Present Address', valueText: formState.address },
      { section: 'Personal Information', keyLabel: 'Current City / Area', valueText: formState.location },
      { section: 'Personal Information', keyLabel: 'LinkedIn Profile', valueText: formState.linkedin || 'Not provided' },
      { section: 'Educational Background', keyLabel: 'Highest Qualification', valueText: formState.highestQualification },
      { section: 'Educational Background', keyLabel: 'Degree Program / Discipline', valueText: formState.degreeProgram },
      { section: 'Educational Background', keyLabel: 'Major / Field of Study', valueText: formState.major || 'Marketing / Business' },
      { section: 'Educational Background', keyLabel: 'University / Institution', valueText: formState.institution },
      { section: 'Educational Background', keyLabel: 'Graduation Year & CGPA', valueText: `${formState.graduationYear} (Result: ${formState.academicResult || 'Appeared'})` },
      { section: 'Educational Background', keyLabel: 'Currently Enrolled / Studying', valueText: formState.currentlyStudying || 'No' },
      { section: 'Sales & Marketing Competencies', keyLabel: 'Core Sales & Marketing Skills', valueText: formState.salesMarketingSkills.join(' · ') },
      { section: 'Sales & Marketing Competencies', keyLabel: 'Preferred Lead Gen Channels', valueText: formState.leadGenChannels.length ? formState.leadGenChannels.join(' · ') : 'Direct B2B outreach' },
      { section: 'Sales & Marketing Competencies', keyLabel: 'Negotiation & Persuasion Self-Rating', valueText: `${formState.negotiationRating} / 5` },
      { section: 'Sales & Marketing Competencies', keyLabel: 'Microsoft Excel Skill', valueText: formState.excelSkill },
      { section: 'Sales & Marketing Competencies', keyLabel: 'Social Media & Digital Marketing', valueText: formState.socialMediaSkill },
      { section: 'Sales & Marketing Competencies', keyLabel: 'Spoken Bengali Fluency', valueText: formState.spokenBengaliFluency },
      { section: 'Sales & Marketing Competencies', keyLabel: 'Spoken English Fluency', valueText: formState.spokenEnglishFluency },
      { section: 'Experience & Background', keyLabel: 'Work Experience Status', valueText: formState.workExperience },
      { section: 'Experience & Background', keyLabel: 'Prior Organization / Role', valueText: formState.organization ? `${formState.organization} (${formState.jobTitle || 'Executive'})` : 'Fresh Graduate' },
      { section: 'Experience & Background', keyLabel: 'Sales Achievements / Track Record', valueText: formState.salesAchievements || 'Coursework & practical presentations' },
      { section: 'Availability & Preferences', keyLabel: 'Full-Time Commitment', valueText: formState.fullTime },
      { section: 'Availability & Preferences', keyLabel: 'Joining Timeframe', valueText: formState.joinTime },
      { section: 'Availability & Preferences', keyLabel: 'Panthapath Workplace Acceptance', valueText: formState.officeLocation },
      { section: 'Availability & Preferences', keyLabel: 'Expected Monthly Salary', valueText: formState.salary },
      { section: 'Availability & Preferences', keyLabel: 'Incentive & Commission Expectation', valueText: formState.incentiveExpectation },
      { section: 'Availability & Preferences', keyLabel: 'Notice Period', valueText: formState.noticePeriod || 'Immediate' },
      { section: 'Documents & Attachments', keyLabel: 'Attached CV / Resume', valueText: cvFile ? `${cvFile.fileName} (${formatBytes(cvFile.sizeBytes)})` : 'None' },
      { section: 'Documents & Attachments', keyLabel: 'Supporting Documents Count', valueText: `${academicDocs.length} files attached` },
      { section: 'Documents & Attachments', keyLabel: 'Portfolio / Social Profile Link', valueText: formState.portfolio || 'None' },
      { section: 'Motivation & Declaration', keyLabel: 'Career Pitch & Motivation', valueText: formState.motivation },
      { section: 'Motivation & Declaration', keyLabel: 'Declarations Accepted', valueText: 'Accuracy confirmed & contact consent granted' }
    ];
  }, [formState, cvFile, academicDocs, applicationRefId]);

  const handleDownloadPdf = () => {
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

      // Navy Header
      doc.setFillColor(16, 36, 58);
      doc.rect(0, 0, pageWidth, 108, 'F');

      // Crimson / Gold Accent Strip
      doc.setFillColor(220, 38, 38);
      doc.rect(0, 108, pageWidth, 4, 'F');

      doc.setTextColor(221, 195, 143);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('E-LAWYERS · LEGAL & BUSINESS CONSULTANCY FIRM', margin, 34);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(17);
      doc.text('Sales & Marketing Executive — Application Preview', margin, 58);

      doc.setTextColor(214, 226, 235);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text(
        `Ref ID: ${applicationRefId || 'DRAFT'}   |   Dept: Sales & Marketing   |   Location: Panthapath, Dhaka`,
        margin,
        78
      );
      doc.text(
        `Applicant: ${formState.fullName || 'Candidate'} (${formState.email || 'N/A'})   |   Date: ${generatedAtLabel || new Date().toLocaleString()}`,
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

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(16, 36, 58);
        doc.text(keyLines, margin + 8, y + 13);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(40, 52, 65);
        doc.text(valLines, margin + 180, y + 13);

        doc.setDrawColor(230, 235, 240);
        doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

        y += rowHeight;
      });

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(140, 150, 160);
        doc.text(
          `E-Lawyers Legal & Business Consultancy Firm · Panthapath, Dhaka · Page ${i} of ${totalPages}`,
          margin,
          pageHeight - 20
        );
      }

      doc.save(`E-Lawyers_Sales_Marketing_Application_${applicationRefId || 'Preview'}.pdf`);
      showActionFeedback('Official application PDF downloaded successfully.');
    } catch (err) {
      console.error('PDF error:', err);
      showActionFeedback('Could not generate PDF. Please use browser print option.');
    }
  };

  const handleDownloadJson = () => {
    const payload = {
      firm: 'E-Lawyers Legal & Business Consultancy Firm',
      position: 'Sales & Marketing Executive',
      department: 'Sales & Marketing',
      applicationRefId,
      generatedAt: generatedIso,
      candidate: formState,
      attachments: {
        cv: cvFile,
        academicDocs
      }
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `E-Lawyers_Sales_Marketing_Application_${applicationRefId || 'draft'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showActionFeedback('Application data downloaded as JSON.');
  };

  const handleSubmitApplication = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorSummary('');
    setMissingFieldsList([]);

    const missing = validateAllRequiredFields();
    if (missing.length > 0) {
      triggerError(
        'Please complete all required fields highlighted below before submitting your Sales & Marketing application.',
        missing
      );
      return;
    }

    setIsSubmittingApplication(true);

    const now = new Date();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const currentRefId = applicationRefId || `ELAW-SME-${now.getFullYear()}-${randomSuffix}`;
    setApplicationRefId(currentRefId);
    setGeneratedAtLabel(now.toLocaleString());
    setGeneratedIso(now.toISOString());

    const candidatePayload: CareerApplicationData = {
      applicationRefId: currentRefId,
      position: 'Sales & Marketing Executive',
      department: 'Sales & Marketing',
      fullName: formState.fullName.trim(),
      email: formState.email.trim().toLowerCase(),
      phone: formState.phone.trim(),
      whatsapp: formState.whatsapp.trim() || undefined,
      address: formState.address.trim(),
      location: formState.location.trim(),
      linkedin: formState.linkedin.trim() || undefined,
      highestQualification: formState.highestQualification,
      degreeProgram: formState.degreeProgram.trim(),
      major: formState.major.trim() || 'Marketing / Business Administration',
      institution: formState.institution.trim(),
      graduationYear: formState.graduationYear,
      academicResult: formState.academicResult.trim() || 'Appeared',
      currentlyStudying: formState.currentlyStudying || 'No',
      salesMarketingSkills: formState.salesMarketingSkills.length > 0 ? formState.salesMarketingSkills : ['B2B Corporate Client Acquisition'],
      leadGenChannels: formState.leadGenChannels.length > 0 ? formState.leadGenChannels : ['Direct Corporate Visits & In-Person Pitching'],
      excelSkill: formState.excelSkill || 'Intermediate',
      workExperience: formState.workExperience || 'Fresh Graduate',
      experienceLength: formState.experienceLength.trim() || undefined,
      organization: formState.organization.trim() || undefined,
      jobTitle: formState.jobTitle.trim() || undefined,
      responsibilities: formState.responsibilities.trim() || undefined,
      training: 'Corporate Sales & Business Development Track',
      trainingDetails: formState.salesAchievements ? `Sales Track: ${formState.salesAchievements}` : undefined,
      fullTime: formState.fullTime || 'Yes',
      joinTime: formState.joinTime || 'Immediately (তাৎক্ষণিক)',
      officeLocation: formState.officeLocation || 'Yes',
      salary: formState.salary.trim(),
      noticePeriod: formState.noticePeriod.trim() || undefined,
      cvFileName: cvFile ? cvFile.fileName : 'Sales_Resume.pdf',
      cvFileSize: cvFile ? cvFile.sizeBytes : 350000,
      academicDocsSummary: academicDocs.length ? academicDocs.map(d => d.fileName).join(', ') : undefined,
      portfolio: formState.portfolio.trim() || undefined,
      motivation: formState.motivation.trim() || 'Interested in joining E-Lawyers as Sales & Marketing Executive.',
      submissionDate: now.toLocaleString()
    };

    try {
      const receipt = await submitCareerApplicationToApi(candidatePayload);
      setApplicationRefId(receipt.referenceId);
      setIsSubmittedToHr(true);
      setIsPreviewVisible(true);
      setSubmissionReceipt(receipt);

      showActionFeedback(
        `Application ${receipt.referenceId} submitted and HR notification confirmed.`
      );

      setTimeout(() => {
        resultCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f5f8] text-[#243446] font-sans">
      <ServiceSEO
        title="Sales & Marketing Executive | E-Lawyers Job Circular & Online Application"
        description="E-Lawyers Legal & Business Consultancy Firm is hiring dynamic Sales & Marketing Executives for our Panthapath, Dhaka corporate office. Fresh graduates in Marketing, BBA, or Business Studies welcome. Apply online with ease."
        canonicalUrl="/Careers/sales-marketing"
        serviceType="Job Recruitment Posting & Application"
      />

      {/* Hero Header - Light Corporate Theme with Ruby / Gold Accents */}
      <section className="bg-gradient-to-b from-white via-[#f8fafc] to-[#f1f5f9] text-slate-800 pt-10 pb-16 px-4 border-b border-slate-200 relative overflow-hidden">
        {/* Subtle ultra-light background accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-200/15 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="max-w-5xl mx-auto relative z-10">
          {/* Top navigation row */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white border-2 border-rose-600/30 flex items-center justify-center font-extrabold text-rose-700 text-lg shadow-xs">
                ELA
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-widest text-[#10243a] uppercase">
                  E-Lawyers Legal &amp; Business Consultancy Firm
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Sales &amp; Business Development Division · Panthapath, Dhaka
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <Link
                to="/Careers/mto"
                className="text-xs bg-white hover:bg-slate-50 text-slate-700 hover:text-[#10243a] px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>MTO Trainee</span>
              </Link>
              <Link
                to="/Careers/accountant"
                className="text-xs bg-white hover:bg-slate-50 text-slate-700 hover:text-[#10243a] px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 font-semibold"
              >
                <Briefcase className="w-3.5 h-3.5 text-[#167d83]" />
                <span>Accountant</span>
              </Link>
              <Link
                to="/Careers/customer-care"
                className="text-xs bg-white hover:bg-slate-50 text-slate-700 hover:text-[#10243a] px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 font-semibold"
              >
                <Users className="w-3.5 h-3.5 text-teal-600" />
                <span>Customer Care</span>
              </Link>
              <Link
                to="/Careers"
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> All Openings
              </Link>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 text-rose-900 border border-rose-200 text-xs font-bold mb-3 shadow-2xs">
            <Target className="w-3.5 h-3.5 text-rose-600" /> Official Recruitment Circular · Sales &amp; Growth Team
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#10243a] mb-3">
            Sales &amp; Marketing Executive
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mb-6 leading-relaxed">
            কর্পোরেট সেলস ও ক্লায়েন্ট অ্যাকুইজিশনে আকর্ষণীয় ক্যারিয়ার। আপনার যোগাযোগ, সম্পর্ক তৈরি ও কনভিন্স করার দক্ষতাকে কাজে লাগিয়ে E-Lawyers-এর লিগ্যাল, ট্যাক্স, অ্যাকাউন্টিং ও কনসালটেন্সি সেবাকে ছড়িয়ে দিন দেশজুড়ে।
          </p>

          {/* Key metadata badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 text-center shadow-xs">
              <Users className="w-4 h-4 mx-auto text-rose-600 mb-1" />
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Vacancies</div>
              <div className="text-sm font-bold text-[#10243a]">Multiple Openings</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-3 text-center shadow-xs">
              <GraduationCap className="w-4 h-4 mx-auto text-rose-600 mb-1" />
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Qualification</div>
              <div className="text-sm font-bold text-[#10243a]">Bachelor's Degree</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-3 text-center shadow-xs">
              <Compass className="w-4 h-4 mx-auto text-rose-600 mb-1" />
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Discipline</div>
              <div className="text-sm font-bold text-[#10243a]">BBA / Mkt / Any</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-3 text-center shadow-xs">
              <MapPin className="w-4 h-4 mx-auto text-rose-600 mb-1" />
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Workplace</div>
              <div className="text-sm font-bold text-[#10243a]">Panthapath, Dhaka</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-3 text-center shadow-xs">
              <DollarSign className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Remuneration</div>
              <div className="text-sm font-bold text-emerald-700">Salary + Incentive</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-3 text-center shadow-xs">
              <Calendar className="w-4 h-4 mx-auto text-amber-600 mb-1" />
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Deadline</div>
              <div className="text-sm font-bold text-amber-700">31 October 2026</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container - CRITICAL: relative z-20 prevents clipping by header */}
      <main className="relative z-20 max-w-5xl mx-auto px-4 -mt-8 pb-20">
        {/* Tab Navigation Pill Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-2 mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleTabChange('circular')}
              className={`flex-1 sm:flex-initial px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'circular'
                  ? 'bg-[#10243a] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#c7a76b]" />
              <span>Job Circular (সম্পূর্ণ বিজ্ঞপ্তি)</span>
            </button>

            <button
              onClick={() => handleTabChange('apply')}
              className={`flex-1 sm:flex-initial px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'apply'
                  ? 'bg-rose-700 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4 text-rose-200" />
              <span>Apply Online (অনলাইন আবেদন)</span>
              <span className="ml-1 bg-amber-400 text-[#10243a] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {formProgress}%
              </span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 pr-2 text-xs text-slate-500">
            <Phone className="w-4 h-4 text-rose-600" />
            <span>Recruitment Desk: career@elawyersbd.com</span>
          </div>
        </div>

        {/* Global Action Feedback Notification */}
        {actionFeedback && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm flex items-center gap-3 shadow-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{actionFeedback}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: JOB CIRCULAR / সম্পূর্ণ বিজ্ঞপ্তি */}
        {/* ======================================================== */}
        {activeTab === 'circular' && (
          <div className="space-y-8 animate-fade-in">
            {/* Urgent Notice Banner */}
            <div className="bg-[#fffaf0] border border-[#ead9b4] border-l-4 border-l-[#c7a76b] rounded-xl p-5 text-slate-800 shadow-sm">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#c7a76b] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-base text-[#10243a] mb-1">
                    WE ARE HIRING: SALES &amp; MARKETING EXECUTIVE — দ্রুত আবেদন করুন
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    E-Lawyers Legal &amp; Business Consultancy Firm is looking for motivated, confident, and target-oriented individuals to join our team as <strong>Sales &amp; Marketing Executives</strong>. The ideal candidates will help expand our client base, promote our professional services, build strong client relationships, and contribute to the firm's business growth.
                  </p>
                </div>
              </div>
            </div>

            {/* Position Details Matrix Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#10243a]">Position Overview &amp; Specifications</h3>
                  <p className="text-xs text-slate-500">Official sales &amp; business development placement specifications</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Position</div>
                  <div className="text-sm font-extrabold text-[#10243a]">Sales &amp; Marketing Executive</div>
                  <div className="text-xs text-slate-500 mt-0.5">সেলস অ্যান্ড মার্কেটিং এক্সিকিউটিভ</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department</div>
                  <div className="text-sm font-extrabold text-[#10243a]">Sales &amp; Marketing Division</div>
                  <div className="text-xs text-slate-500 mt-0.5">বিজনেস ডেভেলপমেন্ট ও ক্লায়েন্ট একুইজিশন</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Employment Type</div>
                  <div className="text-sm font-extrabold text-rose-800">Full-Time Corporate</div>
                  <div className="text-xs text-slate-500 mt-0.5">Target-based Commission + Base</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Vacancies &amp; Workplace</div>
                  <div className="text-sm font-extrabold text-[#10243a]">Multiple · Panthapath, Dhaka</div>
                  <div className="text-xs text-slate-500 mt-0.5">BTI Centara Grand Office HQ</div>
                </div>
              </div>
            </div>

            {/* Key Responsibilities - Grouped 10 points */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
                  <Target className="w-6 h-6 text-[#c7a76b]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#10243a]">Key Responsibilities (মূল দায়িত্ব ও কার্যক্রম)</h3>
                  <p className="text-xs text-slate-500">10 core focus areas for high-performance sales executives</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    num: '01',
                    title: 'B2B Client Identification & Growth',
                    desc: "Identify potential clients and generate new business opportunities for the firm's legal, taxation, accounting, and business consultancy services.",
                    bn: 'সম্ভাব্য ক্লায়েন্ট চিহ্নিত করা এবং নতুন বিজনেস অপরচুনিটি তৈরি করা।'
                  },
                  {
                    num: '02',
                    title: 'Multi-Channel Service Promotion',
                    desc: "Promote the firm's services through direct communication, phone calls, email, social media, and other marketing channels.",
                    bn: 'ফোন কল, সরাসরি যোগাযোগ ও সোশ্যাল মিডিয়ায় সেবাসমূহের প্রচার।'
                  },
                  {
                    num: '03',
                    title: 'Relationship Building & Networking',
                    desc: 'Build and maintain professional relationships with existing and prospective business clients.',
                    bn: 'নতুন ও বিদ্যমান ক্লায়েন্টদের সাথে দীর্ঘমেয়াদী পেশাদার সম্পর্ক বজায় রাখা।'
                  },
                  {
                    num: '04',
                    title: 'Client Needs Analysis & Coordination',
                    desc: 'Understand client requirements and coordinate with relevant departments (Tax, Accounts, Legal) to provide appropriate service information.',
                    bn: 'গ্রাহকের চাহিদা বুঝে ফার্মের সংশ্লিষ্ট বিশেষজ্ঞ টিমের সাথে সমন্বয়।'
                  },
                  {
                    num: '05',
                    title: 'Follow-ups & Client Conversion',
                    desc: 'Follow up with prospective clients, manage inquiries, and support client conversion to closed retainer contracts.',
                    bn: 'প্রোসপেক্ট ক্লায়েন্টদের ফলো-আপ করা এবং সেলস কনভার্শন নিশ্চিত করা।'
                  },
                  {
                    num: '06',
                    title: 'Sales & Marketing Strategy Execution',
                    desc: 'Assist in developing and implementing sales and marketing strategies to achieve corporate revenue targets.',
                    bn: 'সেলস টার্গেট অর্জনে কৌশল প্রণয়ন ও বাস্তবায়নে সহায়তা।'
                  },
                  {
                    num: '07',
                    title: 'Market Research & Segmentation',
                    desc: 'Conduct market research and identify potential industries, businesses, corporate hubs, and customer segments.',
                    bn: 'মার্কেট রিসার্চ এবং সম্ভাবনাময় শিল্প ও ক্লায়েন্ট সেগমেন্ট চিহ্নিতকরণ।'
                  },
                  {
                    num: '08',
                    title: 'Database & Pipeline Management',
                    desc: 'Maintain client databases, CRM records, sales pipelines, and regular progress reports for management review.',
                    bn: 'ক্লায়েন্ট ডেটাবেজ, সেলস রেকর্ড ও নিয়মিত অগ্রগতি প্রতিবেদন সংরক্ষণ।'
                  },
                  {
                    num: '09',
                    title: 'Digital Marketing & Campaigns',
                    desc: 'Support promotional campaigns, digital marketing activities, webinars, and business development initiatives.',
                    bn: 'প্রমোশনাল ক্যাম্পেইন ও ডিজিটাল মার্কেটিং কার্যক্রমে সক্রিয় অংশ নেয়া।'
                  },
                  {
                    num: '10',
                    title: 'Professional Representation & Confidentiality',
                    desc: 'Represent E-Lawyers professionally and maintain strict confidentiality when handling client information.',
                    bn: 'পেশাদারিত্বের সাথে ফার্মের প্রতিনিধিত্ব এবং তথ্যের সর্বোচ্চ গোপনীয়তা রক্ষা।'
                  }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200/90 bg-[#fbfcfd] hover:border-rose-300 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          {item.num}
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <h5 className="font-bold text-sm text-[#10243a] mb-1 leading-snug">{item.title}</h5>
                      <p className="text-xs text-slate-600 leading-relaxed mb-2">{item.desc}</p>
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 border-t border-slate-100 pt-2">
                      {item.bn}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Educational & Skills Matrix */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Educational Requirements */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#10243a]">Educational Requirements</h3>
                    <p className="text-xs text-slate-500">Academic criteria for sales applicants</p>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs md:text-sm text-slate-700">
                  <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200/80">
                    <strong className="text-[#10243a] block mb-1">Target Academic Degrees:</strong>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {['BBA in Marketing', 'Business Administration', 'Management Studies', 'Finance / Economics', 'Mass Communication', 'Any Discipline with Sales Acumen'].map((deg, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 bg-white px-2.5 py-1.5 rounded-lg border border-rose-200/60 shadow-2xs">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{deg}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <ul className="space-y-2 list-disc list-inside text-slate-600 leading-relaxed pt-1">
                    <li>
                      Candidates from other academic backgrounds with relevant sales, marketing, or business development skills are welcome to apply.
                    </li>
                    <li>
                      <strong>Fresh graduates with strong communication and persuasion skills are warmly encouraged to apply.</strong>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Required & Preferred Skills */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
                    <Award className="w-6 h-6 text-[#c7a76b]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#10243a]">Required &amp; Preferred Skills</h3>
                    <p className="text-xs text-slate-500">Core competencies &amp; sales traits</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs md:text-sm text-slate-700">
                  {[
                    'Excellent verbal and written communication skills (Bengali & English).',
                    'Strong interpersonal, negotiation, and persuasion abilities.',
                    'Confidence in communicating with business owners and prospective clients.',
                    'Target-oriented mindset with ability to manage multiple client leads.',
                    'Familiarity with social media marketing, LinkedIn, and online client acquisition.',
                    'Prior experience in sales, telemarketing, or professional service consultancy is an advantage.',
                    'Professional attitude, honesty, and a strong sense of responsibility.'
                  ].map((skill, sIdx) => (
                    <div key={sIdx} className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                      <CheckCircle2 className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* What We Offer & Benefits */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#10243a]">What We Offer (বেতন, কমিশন ও সুযোগ-সুবিধাসমূহ)</h3>
                  <p className="text-xs text-slate-500">Rewarding incentive structure for sales champions</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#f7f9fb] border border-slate-200 text-center">
                  <div className="text-xs font-semibold text-slate-500 mb-1">মাসিক মূল বেতন</div>
                  <div className="text-base font-bold text-[#10243a]">আলোচনা সাপেক্ষে</div>
                  <div className="text-[11px] text-slate-500 mt-1">Negotiable base remuneration</div>
                </div>

                <div className="p-4 rounded-xl bg-[#f7f9fb] border border-slate-200 text-center">
                  <div className="text-xs font-semibold text-slate-500 mb-1">সেলস কমিশন ও ইনসেন্টিভ</div>
                  <div className="text-base font-bold text-emerald-700">আকর্ষণীয় টার্গেট কমিশন</div>
                  <div className="text-[11px] text-slate-500 mt-1">Performance-based earnings</div>
                </div>

                <div className="p-4 rounded-xl bg-[#f7f9fb] border border-slate-200 text-center">
                  <div className="text-xs font-semibold text-slate-500 mb-1">উৎসব বোনাস</div>
                  <div className="text-base font-bold text-rose-800">বার্ষিক ২টি উৎসব বোনাস</div>
                  <div className="text-[11px] text-slate-500 mt-1">Company policy standard</div>
                </div>

                <div className="p-4 rounded-xl bg-[#f7f9fb] border border-slate-200 text-center">
                  <div className="text-xs font-semibold text-slate-500 mb-1">ক্যারিয়ার প্রগ্রেশন</div>
                  <div className="text-base font-bold text-[#10243a]">টিম লিড ও ম্যানেজমেন্ট</div>
                  <div className="text-[11px] text-slate-500 mt-1">Fast-track corporate leadership</div>
                </div>
              </div>
            </div>

            {/* How to Apply & Office Card */}
            <div className="bg-gradient-to-br from-[#10243a] via-[#1c2c3e] to-[#2b1b28] text-white rounded-2xl p-6 md:p-8 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h4 className="text-lg font-bold text-amber-300 mb-2 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-rose-400" />
                    How to Apply &amp; Official Contact
                  </h4>
                  <p className="text-sm text-slate-200 leading-relaxed max-w-xl mb-3">
                    Interested candidates are requested to submit their updated CV through our online portal or via email.
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                    <strong>E-Lawyers Legal &amp; Business Consultancy Firm</strong><br />
                    G-5, BTI Centara Grand, 144–144/1 Green Road, Panthapath, Dhaka-1205, Bangladesh.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-300">
                    <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-amber-400" /> career@elawyersbd.com</span>
                    <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-amber-400" /> +880 1313-583838</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleTabChange('apply')}
                    className="px-8 py-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    <span>Apply Online Now</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    className="px-5 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Spec</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: ONLINE APPLICATION FORM / আবেদন ফর্ম */}
        {/* ======================================================== */}
        {activeTab === 'apply' && (
          <div className="app-form-60 w-full lg:w-[60vw] mx-auto space-y-8 animate-fade-in">
            {/* Top Assistant Control Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                  8
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#10243a]">Sales &amp; Marketing 8-Step Application Form</h4>
                  <p className="text-xs text-slate-500">Auto-saves to browser draft · Fast-track validation</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleFillSample}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-700" />
                  <span>Fill Sample Data (নমুনা তথ্য)</span>
                </button>

                <button
                  type="button"
                  onClick={expandAllSections}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Expand All</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearForm}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Error Summary Banner */}
            {errorSummary && (
              <div className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 shadow-sm animate-fade-in">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h5 className="font-bold text-sm text-rose-950">{errorSummary}</h5>
                    {missingFieldsList.length > 0 && (
                      <ul className="text-xs space-y-1 list-disc list-inside text-rose-800">
                        {missingFieldsList.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Application Form */}
            <form
              ref={formRef}
              noValidate
              onSubmit={handleSubmitApplication}
              className="space-y-6"
            >
              {/* STEP 1: Personal & Contact */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => toggleSection(1)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer border-b border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center">
                      1
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-[#10243a]">Personal Identification &amp; Contact Details</h4>
                      <p className="text-xs text-slate-500">আপনার নাম ও সরাসরি যোগাযোগের তথ্য</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openSections[1] ? 'rotate-180' : ''}`} />
                </button>

                {openSections[1] && (
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="csm-fullname" className="block text-xs font-bold text-slate-700 mb-1">
                          Full Legal Name (পূর্ণ নাম) <span className="text-rose-600">*</span>
                        </label>
                        <input
                          id="csm-fullname"
                          name="name"
                          autoComplete="name"
                          type="text"
                          inputMode="text"
                          required
                          value={formState.fullName}
                          onChange={e => handleInputChange('fullName', e.target.value)}
                          placeholder="e.g. Shahriar Kabir Rifat"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label htmlFor="csm-email" className="block text-xs font-bold text-slate-700 mb-1">
                          Email Address (ইমেইল) <span className="text-rose-600">*</span>
                        </label>
                        <input
                          id="csm-email"
                          name="email"
                          autoComplete="email"
                          type="email"
                          inputMode="email"
                          required
                          value={formState.email}
                          onChange={e => handleInputChange('email', e.target.value)}
                          placeholder="shahriar.kabir@example.com"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="csm-phone" className="block text-xs font-bold text-slate-700 mb-1">
                          Primary Contact Number (মোবাইল নম্বর) <span className="text-rose-600">*</span>
                        </label>
                        <input
                          id="csm-phone"
                          name="tel"
                          autoComplete="tel"
                          type="tel"
                          inputMode="tel"
                          required
                          value={formState.phone}
                          onChange={e => handleInputChange('phone', e.target.value)}
                          placeholder="+880 1712-XXXXXX"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label htmlFor="csm-whatsapp" className="block text-xs font-bold text-slate-700 mb-1">
                          WhatsApp Number (হোয়াটসঅ্যাপ নম্বর)
                        </label>
                        <input
                          id="csm-whatsapp"
                          name="whatsapp"
                          autoComplete="tel"
                          type="tel"
                          inputMode="tel"
                          value={formState.whatsapp}
                          onChange={e => handleInputChange('whatsapp', e.target.value)}
                          placeholder="+880 1712-XXXXXX"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="csm-address" className="block text-xs font-bold text-slate-700 mb-1">
                          Present Address (বর্তমান ঠিকানা) <span className="text-rose-600">*</span>
                        </label>
                        <input
                          id="csm-address"
                          name="street-address"
                          autoComplete="street-address"
                          type="text"
                          inputMode="text"
                          required
                          value={formState.address}
                          onChange={e => handleInputChange('address', e.target.value)}
                          placeholder="House/Apartment, Road, Area, Dhaka"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label htmlFor="csm-location" className="block text-xs font-bold text-slate-700 mb-1">
                          Current City / Area (বর্তমান শহর/এলাকা) <span className="text-rose-600">*</span>
                        </label>
                        <input
                          id="csm-location"
                          name="address-level2"
                          autoComplete="address-level2"
                          type="text"
                          inputMode="text"
                          required
                          value={formState.location}
                          onChange={e => handleInputChange('location', e.target.value)}
                          placeholder="e.g. Panthapath, Dhanmondi, Farmgate, Dhaka"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        LinkedIn Profile Link (লিঙ্কডইন প্রোফাইল)
                      </label>
                      <input
                        type="url"
                        inputMode="url"
                        value={formState.linkedin}
                        onChange={e => handleInputChange('linkedin', e.target.value)}
                        placeholder="https://linkedin.com/in/yourname"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 2: Educational Background */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => toggleSection(2)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer border-b border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center">
                      2
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-[#10243a]">Educational Qualifications &amp; Academic Background</h4>
                      <p className="text-xs text-slate-500">স্নাতক / ডিগ্রি / অনুষদের বিবরণ</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openSections[2] ? 'rotate-180' : ''}`} />
                </button>

                {openSections[2] && (
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Highest Educational Level <span className="text-rose-600">*</span>
                        </label>
                        <select
                          required
                          value={formState.highestQualification}
                          onChange={e => handleInputChange('highestQualification', e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all bg-white"
                        >
                          <option value="">Select Level</option>
                          <option value="Bachelor's Degree (স্নাতক / সমমান)">Bachelor's Degree (স্নাতক / সমমান)</option>
                          <option value="Master's Degree (মাস্টার্স / সমমান)">Master's Degree (মাস্টার্স / সমমান)</option>
                          <option value="Appeared / Final Year Student (শেষ বর্ষের শিক্ষার্থী)">Appeared / Final Year Student (শেষ বর্ষের শিক্ষার্থী)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Degree / Discipline (অনুষদ) <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formState.degreeProgram}
                          onChange={e => handleInputChange('degreeProgram', e.target.value)}
                          placeholder="e.g. BBA / Marketing / Management / Business Studies"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Major / Concentration (প্রধান বিষয়)
                        </label>
                        <input
                          type="text"
                          value={formState.major}
                          onChange={e => handleInputChange('major', e.target.value)}
                          placeholder="e.g. Marketing, Sales, General Business"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          University / Institution Name <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formState.institution}
                          onChange={e => handleInputChange('institution', e.target.value)}
                          placeholder="e.g. Dhaka University, BRAC, NSU, AIUB, National Univ"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Passing / Expected Year <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formState.graduationYear}
                          onChange={e => handleInputChange('graduationYear', e.target.value)}
                          placeholder="e.g. 2024, 2025, 2026"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Academic Result / CGPA / Class
                        </label>
                        <input
                          type="text"
                          value={formState.academicResult}
                          onChange={e => handleInputChange('academicResult', e.target.value)}
                          placeholder="e.g. 3.50 out of 4.00 / 1st Class"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Currently Enrolled in Any Active Courses?
                        </label>
                        <select
                          value={formState.currentlyStudying}
                          onChange={e => handleInputChange('currentlyStudying', e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all bg-white"
                        >
                          <option value="No (Completed all academic requirements)">No (Completed all academic requirements)</option>
                          <option value="Yes - Evening / Weekend MBA or Masters">Yes - Evening / Weekend MBA or Masters</option>
                          <option value="Yes - Final semester / defense pending">Yes - Final semester / defense pending</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 3: Sales & Marketing Competencies */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => toggleSection(3)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer border-b border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center">
                      3
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-[#10243a]">Sales, Marketing &amp; Business Development Skills</h4>
                      <p className="text-xs text-slate-500">আপনার সেলস ও ক্লায়েন্ট কনভার্শন দক্ষতা (অন্তত ১টি সিলেক্ট করুন)</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openSections[3] ? 'rotate-180' : ''}`} />
                </button>

                {openSections[3] && (
                  <div className="p-5 sm:p-6 space-y-4">
                    <p className="text-xs text-slate-600">
                      Select the sales and marketing activities you are confident in performing:
                    </p>

                    <div className="grid sm:grid-cols-2 gap-3">
                      {SALES_SKILLS_OPTIONS.map(skill => {
                        const isSelected = formState.salesMarketingSkills.includes(skill.value);
                        return (
                          <div
                            key={skill.id}
                            onClick={() => handleToggleSkill(skill.value)}
                            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                              isSelected
                                ? 'bg-rose-50/80 border-rose-600 text-[#10243a] shadow-xs'
                                : 'bg-[#fbfcfd] border-slate-200 hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // handled by parent div
                              className="w-4 h-4 mt-0.5 rounded text-rose-600 focus:ring-rose-600"
                            />
                            <div>
                              <div className="text-xs sm:text-sm font-bold">{skill.label}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">{skill.bn}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Preferred Lead Generation Channels
                      </label>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {LEAD_GEN_OPTIONS.map(ch => {
                          const isChecked = formState.leadGenChannels.includes(ch.value);
                          return (
                            <label
                              key={ch.id}
                              onClick={() => handleToggleLeadChannel(ch.value)}
                              className={`p-2.5 rounded-lg border text-xs font-medium cursor-pointer flex items-center gap-2 transition-colors ${
                                isChecked
                                  ? 'bg-rose-50 border-rose-400 text-rose-950 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="w-3.5 h-3.5 text-rose-600 rounded"
                              />
                              <span>{ch.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Negotiation &amp; Persuasion Self-Rating (1-5)
                      </label>
                      <div className="flex items-center gap-3">
                        {['1', '2', '3', '4', '5'].map(rating => (
                          <label
                            key={rating}
                            className={`flex-1 text-center py-2.5 rounded-xl border cursor-pointer font-bold text-xs transition-all ${
                              formState.negotiationRating === rating
                                ? 'bg-[#10243a] text-white border-[#10243a]'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name="negotiationRating"
                              value={rating}
                              checked={formState.negotiationRating === rating}
                              onChange={e => handleInputChange('negotiationRating', e.target.value)}
                              className="sr-only"
                            />
                            {rating} {rating === '5' ? '★ (Top Closer)' : rating === '1' ? '(Basic)' : ''}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 4: Software, Social Media & Communication */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => toggleSection(4)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer border-b border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center">
                      4
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-[#10243a]">Digital Tools, Social Media &amp; Communication Fluency</h4>
                      <p className="text-xs text-slate-500">এমএস এক্সেল, সোশ্যাল মিডিয়া মার্কেটিং ও বাচনভঙ্গি</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openSections[4] ? 'rotate-180' : ''}`} />
                </button>

                {openSections[4] && (
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Microsoft Excel / Spreadsheet Proficiency
                        </label>
                        <select
                          value={formState.excelSkill}
                          onChange={e => handleInputChange('excelSkill', e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all bg-white"
                        >
                          <option value="Basic (Data Entry & Lead Lists)">Basic (Data Entry &amp; Lead Lists)</option>
                          <option value="Intermediate (Sales Tracking, Client Data Lists)">Intermediate (Sales Tracking, Client Data Lists)</option>
                          <option value="Advanced (Pivot Tables, Pipeline Analytics)">Advanced (Pivot Tables, Pipeline Analytics)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Social Media &amp; Digital Marketing Familiarity
                        </label>
                        <select
                          value={formState.socialMediaSkill}
                          onChange={e => handleInputChange('socialMediaSkill', e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all bg-white"
                        >
                          <option value="Basic (Personal Social Media User)">Basic (Personal Social Media User)</option>
                          <option value="Proficient (Page Management & Group Posting)">Proficient (Page Management &amp; Group Posting)</option>
                          <option value="Advanced (LinkedIn, Facebook Pages, Meta Ads)">Advanced (LinkedIn, Facebook Pages, Meta Ads)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Spoken &amp; Written Bengali Fluency <span className="text-rose-600">*</span>
                        </label>
                        <select
                          value={formState.spokenBengaliFluency}
                          onChange={e => handleInputChange('spokenBengaliFluency', e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all bg-white"
                        >
                          <option value="Native / Fluent (মাতৃভাষা/সাবলীল)">Native / Fluent (মাতৃভাষা/সাবলীল)</option>
                          <option value="Professional (মার্জিত ও প্রভাবশালী বাচনভঙ্গি)">Professional (মার্জিত ও প্রভাবশালী বাচনভঙ্গি)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Spoken &amp; Written English Fluency <span className="text-rose-600">*</span>
                        </label>
                        <select
                          value={formState.spokenEnglishFluency}
                          onChange={e => handleInputChange('spokenEnglishFluency', e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all bg-white"
                        >
                          <option value="Conversational (কথোপকথন উপযোগী)">Conversational (কথোপকথন উপযোগী)</option>
                          <option value="Fluent / Professional (পেশাদার মানের)">Fluent / Professional (পেশাদার মানের)</option>
                          <option value="Basic (সাধারণ বোঝা ও লেখা)">Basic (সাধারণ বোঝা ও লেখা)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 5: Sales Experience & Track Record */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => toggleSection(5)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer border-b border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center">
                      5
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-[#10243a]">Sales Experience, Prior Roles &amp; Track Record</h4>
                      <p className="text-xs text-slate-500">পূর্ব অভিজ্ঞতা, সেলস টার্গেট ও অর্জনসমূহ</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openSections[5] ? 'rotate-180' : ''}`} />
                </button>

                {openSections[5] && (
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Sales Experience Status <span className="text-rose-600">*</span>
                        </label>
                        <select
                          value={formState.workExperience}
                          onChange={e => handleInputChange('workExperience', e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all bg-white"
                        >
                          <option value="Fresh Graduate">Fresh Graduate (কোনো পূর্ব অভিজ্ঞতা নেই)</option>
                          <option value="Fresh Graduate with Internship (ইন্টার্নশিপ সম্পন্ন)">Fresh Graduate with Internship (ইন্টার্নশিপ সম্পন্ন)</option>
                          <option value="1 - 2 Years Sales / Marketing Experience">1 - 2 Years Sales / Marketing Experience</option>
                          <option value="3+ Years Experienced Sales Professional">3+ Years Experienced Sales Professional</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Experience Length
                        </label>
                        <input
                          type="text"
                          value={formState.experienceLength}
                          onChange={e => handleInputChange('experienceLength', e.target.value)}
                          placeholder="e.g. 6 Months Internship / 1 Year Corporate Sales"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Prior Organization / Company Name (if any)
                        </label>
                        <input
                          type="text"
                          value={formState.organization}
                          onChange={e => handleInputChange('organization', e.target.value)}
                          placeholder="e.g. ABC Marketing Agency / Corporate Firm"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Job Title / Designation
                        </label>
                        <input
                          type="text"
                          value={formState.jobTitle}
                          onChange={e => handleInputChange('jobTitle', e.target.value)}
                          placeholder="e.g. Sales Executive / Brand Representative"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Key Sales Responsibilities &amp; Notable Achievements
                      </label>
                      <textarea
                        rows={2}
                        value={formState.salesAchievements}
                        onChange={e => handleInputChange('salesAchievements', e.target.value)}
                        placeholder="Mention any monthly targets achieved, clients closed, or campaigns managed."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 6: Availability & Preferences */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => toggleSection(6)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer border-b border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center">
                      6
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-[#10243a]">Availability &amp; Remuneration Preferences</h4>
                      <p className="text-xs text-slate-500">কাজের প্রাপ্যতা, অফিস সম্মতি ও বেতন প্রত্যাশা</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openSections[6] ? 'rotate-180' : ''}`} />
                </button>

                {openSections[6] && (
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Full-Time Commitment <span className="text-rose-600">*</span>
                        </label>
                        <select
                          value={formState.fullTime}
                          onChange={e => handleInputChange('fullTime', e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all bg-white"
                        >
                          <option value="Yes">Yes (পূর্ণকালীন কাজে সম্মত)</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Joining Timeframe <span className="text-rose-600">*</span>
                        </label>
                        <select
                          value={formState.joinTime}
                          onChange={e => handleInputChange('joinTime', e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all bg-white"
                        >
                          <option value="Immediately (তাৎক্ষণিক)">Immediately (তাৎক্ষণিক)</option>
                          <option value="Within 7 Days (৭ দিনের মধ্যে)">Within 7 Days (৭ দিনের মধ্যে)</option>
                          <option value="Within 15 Days (১৫ দিনের মধ্যে)">Within 15 Days (১৫ দিনের মধ্যে)</option>
                          <option value="Within 1 Month (১ মাসের মধ্যে)">Within 1 Month (১ মাসের মধ্যে)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Panthapath, Dhaka Office Location <span className="text-rose-600">*</span>
                        </label>
                        <select
                          value={formState.officeLocation}
                          onChange={e => handleInputChange('officeLocation', e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all bg-white"
                        >
                          <option value="Yes">Yes (পান্থপথ অফিসে কাজ করতে সম্মত)</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Expected Monthly Base Salary (BDT) <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formState.salary}
                          onChange={e => handleInputChange('salary', e.target.value)}
                          placeholder="e.g. Negotiable or BDT 25,000 - 30,000"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Notice Period (if currently working)
                        </label>
                        <input
                          type="text"
                          value={formState.noticePeriod}
                          onChange={e => handleInputChange('noticePeriod', e.target.value)}
                          placeholder="e.g. None / Available immediately"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 7: CV & Documents Upload */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => toggleSection(7)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer border-b border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center">
                      7
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-[#10243a]">CV &amp; Supporting Documents Upload</h4>
                      <p className="text-xs text-slate-500">সিভি ও শিক্ষাগত সনদের সংযুক্তি (PDF / DOC / DOCX, সর্বোচ্চ ১০MB)</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openSections[7] ? 'rotate-180' : ''}`} />
                </button>

                {openSections[7] && (
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Primary CV Upload */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Updated CV / Resume (PDF, DOC, DOCX) <span className="text-rose-600">*</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          ref={cvInputRef}
                          onChange={handleCvChange}
                          accept=".pdf,.doc,.docx"
                          className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-rose-700 file:text-white hover:file:bg-rose-800 cursor-pointer"
                        />
                      </div>
                      {cvFile && (
                        <div className="mt-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between">
                          <span className="font-medium">Attached: {cvFile.fileName} ({formatBytes(cvFile.sizeBytes)})</span>
                          <button
                            type="button"
                            onClick={() => setCvFile(null)}
                            className="text-rose-600 font-bold hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                      {cvError && <p className="text-xs text-rose-600 mt-1 font-semibold">{cvError}</p>}
                    </div>

                    {/* Academic Documents */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Academic Transcripts or Sales Certificates (Optional)
                      </label>
                      <input
                        type="file"
                        ref={docsInputRef}
                        onChange={handleDocsChange}
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                      />
                      {docsError && <p className="text-xs text-rose-600 mt-1 font-semibold">{docsError}</p>}

                      {academicDocs.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {academicDocs.map((doc, idx) => (
                            <div
                              key={idx}
                              className="text-xs text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center justify-between"
                            >
                              <span>{doc.fileName} ({formatBytes(doc.sizeBytes)})</span>
                              <button
                                type="button"
                                onClick={() => removeDoc(idx)}
                                className="text-rose-600 font-bold hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Sales Portfolio, Pitch Deck or Professional Profile Link
                      </label>
                      <input
                        type="url"
                        value={formState.portfolio}
                        onChange={e => handleInputChange('portfolio', e.target.value)}
                        placeholder="https://linkedin.com/in/... or drive portfolio link"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 8: Motivation & Declaration */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => toggleSection(8)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer border-b border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center">
                      8
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-[#10243a]">Sales Pitch, Statement of Motivation &amp; Declarations</h4>
                      <p className="text-xs text-slate-500">আপনার সেলস পিচ ও আনুষ্ঠানিক অঙ্গীকার</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openSections[8] ? 'rotate-180' : ''}`} />
                </button>

                {openSections[8] && (
                  <div className="p-5 sm:p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Why are you excited to represent E-Lawyers as a Sales &amp; Marketing Executive? <span className="text-rose-600">*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={formState.motivation}
                        onChange={e => handleInputChange('motivation', e.target.value)}
                        placeholder="Briefly explain how you plan to reach B2B clients, your persuasion strengths, and why you want to grow with E-Lawyers (minimum 20 characters)..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          required
                          checked={formState.declarationAccuracy}
                          onChange={e => handleInputChange('declarationAccuracy', e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded text-rose-600 focus:ring-rose-600"
                        />
                        <span className="text-xs text-slate-700 leading-normal">
                          I declare that all the information provided in this Sales &amp; Marketing application is true, complete, and accurate. (ঘোষণা করছি যে প্রদত্ত সকল তথ্য সঠিক ও সত্য) <span className="text-rose-600">*</span>
                        </span>
                      </label>

                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          required
                          checked={formState.declarationContact}
                          onChange={e => handleInputChange('declarationContact', e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded text-rose-600 focus:ring-rose-600"
                        />
                        <span className="text-xs text-slate-700 leading-normal">
                          I grant E-Lawyers recruitment desk permission to contact me via phone, WhatsApp, and email regarding interview scheduling and recruitment updates. (যোগাযোগ ও সাক্ষাৎকারের সম্মতি প্রদান করছি) <span className="text-rose-600">*</span>
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Inline Error Notice Near Submit Bar */}
              {errorSummary && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h5 className="font-bold text-xs text-rose-950">{errorSummary}</h5>
                      {missingFieldsList.length > 0 && (
                        <p className="text-xs text-rose-800">
                          <strong>Missing:</strong> {missingFieldsList.join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                <div className="text-xs text-slate-500">
                  Form Completion: <strong className="text-[#10243a]">{formProgress}%</strong>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleGeneratePreview}
                    className="flex-1 sm:flex-initial px-6 py-3.5 rounded-xl font-bold text-sm bg-[#10243a] hover:bg-[#1a3857] text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Generate Application Preview</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingApplication}
                    className="flex-1 sm:flex-initial px-7 py-3.5 rounded-xl font-extrabold text-sm bg-rose-700 hover:bg-rose-800 text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmittingApplication ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting to HR...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-amber-200" />
                        <span>Submit Application to HR (জমা দিন)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* PREVIEW CARD */}
            {isPreviewVisible && (
              <div
                ref={previewCardRef}
                className="bg-white rounded-3xl border-2 border-slate-300 p-6 md:p-8 shadow-xl space-y-6 animate-fade-in"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-900 border border-rose-200 text-xs font-bold mb-1">
                      <Target className="w-3.5 h-3.5 text-rose-600" />
                      Official Sales &amp; Marketing Application Preview
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-[#10243a]">
                      Application Summary &amp; Verification Card
                    </h3>
                    <p className="text-xs text-slate-500">
                      Ref ID: <strong className="text-rose-700">{applicationRefId}</strong> · Generated: {generatedAtLabel}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadJson}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>JSON Data</span>
                    </button>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#10243a] text-white">
                        <tr>
                          <th className="py-3 px-4 font-bold w-1/3">Field / Requirement</th>
                          <th className="py-3 px-4 font-bold">Candidate Response</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previewRows.map((row, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#fcfdfd]'}>
                            <td className="py-2.5 px-4 font-bold text-slate-700 bg-slate-50/50">{row.keyLabel}</td>
                            <td className="py-2.5 px-4 text-slate-800">{row.valueText}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Final Submission Actions */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-50 via-slate-50 to-amber-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h5 className="font-bold text-sm text-[#10243a]">Ready to Submit to E-Lawyers HR Desk?</h5>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Submitting will send your verified credentials to <strong>career@elawyersbd.com</strong> and record your application.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmittingApplication || isSubmittedToHr}
                    onClick={handleSubmitApplication}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-sm bg-rose-700 hover:bg-rose-800 text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmittingApplication ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting to HR...</span>
                      </>
                    ) : isSubmittedToHr ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>Submitted Successfully!</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Application to HR Desk</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* SUBMISSION RECEIPT CARD */}
            {submissionReceipt && (
              <div
                ref={resultCardRef}
                className="bg-white rounded-3xl border-2 border-emerald-400 p-6 md:p-8 shadow-xl space-y-5 animate-fade-in"
              >
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#10243a]">Application Submission Confirmed!</h3>
                    <p className="text-xs text-slate-500">
                      Reference ID: <strong className="text-emerald-700">{submissionReceipt.referenceId}</strong> · {submissionReceipt.submittedAt}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
                  <p>
                    Thank you, <strong>{submissionReceipt.candidateName}</strong>! Your application for <strong>Sales &amp; Marketing Executive</strong> has been successfully accepted by the E-Lawyers Recruitment Gateway.
                  </p>
                  <p>
                    Our recruitment team will review your qualifications and contact you at <strong>{submissionReceipt.candidateEmail}</strong> for the next interview and sales pitch assessment phase.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#10243a] text-white shadow-xs hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Download Official PDF Receipt</span>
                  </button>

                  <Link
                    to="/Careers"
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <span>Back to Careers Hub</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Floating Viewport Action Toast */}
        {actionFeedback && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-6 right-4 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)] bg-[#10243a] text-white px-5 py-4 rounded-2xl shadow-2xl border border-[#c7a76b]/50 flex items-center gap-3.5 animate-in fade-in slide-in-from-bottom-4 duration-300"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-xs sm:text-sm font-semibold leading-snug flex-1">{actionFeedback}</div>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
