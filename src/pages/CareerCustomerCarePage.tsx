/*
REVISED VERSION NOTES
- Prevents false-positive success receipts when the application API fails.
- Checks HTTP status and safely parses the API response before confirming submission.
- Reports HR/candidate notification status only when the backend explicitly confirms it.
- Validates supporting-document extensions and sizes on the client.
- Uses a generic typed form-update helper instead of `any` for field values.

IMPORTANT: Client-side file checks are not security controls. The server must independently
validate fields and uploaded file contents. This current JSON API payload still sends only
attachment metadata, not the actual CV/document bytes. Implement multipart upload on the
backend and frontend together before relying on uploaded documents in production.
*/

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
  Headphones,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  HeartHandshake,
  TrendingUp,
  X
} from 'lucide-react';
import type { CareerApplicationData } from '../utils/careerEmailTemplate';
import { submitCareerApplicationToApi } from '../utils/careerStorage';

interface FileMeta {
  fileName: string;
  fileType: string;
  sizeBytes: number;
}

interface CustomerCareFormState {
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
  spokenBengaliFluency: string;
  spokenEnglishFluency: string;
  voiceClarity: string;
  customerServiceSkills: string[];
  computerSkills: string[];
  typingSpeed: string;
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

const DRAFT_STORAGE_KEY = 'elaw_career_customercare_draft_v1';

const INITIAL_FORM_STATE: CustomerCareFormState = {
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
  spokenBengaliFluency: '5 - Native / Fluent',
  spokenEnglishFluency: '',
  voiceClarity: 'Clear & Professional',
  customerServiceSkills: [],
  computerSkills: [],
  typingSpeed: '',
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

const SAMPLE_FORM_STATE: CustomerCareFormState = {
  fullName: 'Farhana Yasmin',
  email: 'farhana.yasmin.care@example.com',
  phone: '01712554433',
  whatsapp: '01712554433',
  address: 'House 18, Road 4, Dhanmondi, Dhaka-1205',
  location: 'Panthapath / Dhanmondi, Dhaka',
  linkedin: 'https://www.linkedin.com/in/farhana-yasmin-care',
  highestQualification: 'Bachelor Degree (Honours / Pass)',
  degreeProgram: 'BA (Honours) in English',
  major: 'English Language & Literature',
  institution: 'Eden Mohila College, Dhaka',
  graduationYear: '2025',
  academicResult: 'CGPA 3.45/4.00',
  currentlyStudying: 'No',
  spokenBengaliFluency: '5 - Native / Fluent',
  spokenEnglishFluency: '4 - Good Working Proficiency',
  voiceClarity: 'Clear & Professional',
  customerServiceSkills: [
    'Inbound phone call answering & greeting',
    'Outbound courtesy & follow-up calls',
    'Active listening & empathetic query resolution',
    'WhatsApp Business and Live Chat support',
    'Client appointment scheduling for lawyers & consultants',
    'Professional telephone etiquette & polite tone',
    'Handling difficult customer queries calmly'
  ],
  computerSkills: [
    'Microsoft Office (Word, Excel)',
    'Google Workspace (Docs, Sheets, Gmail, Drive)',
    'WhatsApp Business Web / Desktop',
    'Fast web browsing & CRM data entry',
    'Bengali & English keyboard typing'
  ],
  typingSpeed: 'English 35+ WPM, Bengali 25+ WPM',
  skillsDetails: 'Polite telephone etiquette, active listening, quick typing speed, and adept in keeping daily client inquiry records in Google Sheets and CRM tools.',
  workExperience: 'Customer Care / Call Center experience (Less than 1 year)',
  experienceLength: '10 Months',
  organization: 'Apex BPO & Customer Solutions',
  jobTitle: 'Customer Support Representative',
  responsibilities: 'Managed over 70 inbound customer phone inquiries daily, scheduled client appointments, addressed questions about business services, and logged follow-up requests.',
  training: 'Yes',
  trainingDetails: 'Completed a 3-month Professional Customer Service & Business Communication Certificate course.',
  fullTime: 'Yes',
  joinTime: 'Immediately',
  officeLocation: 'Yes',
  salary: '22000',
  noticePeriod: 'Not applicable',
  portfolio: 'https://linkedin.com/in/farhana-yasmin-care',
  motivation: 'I am passionate about building a rewarding career in customer service with E-Lawyers Legal & Business Consultancy Firm. My strong Bengali & English communication skills, patient attitude, and dedication to client satisfaction will allow me to represent E-Lawyers with the highest standard of professionalism.',
  declarationAccuracy: true,
  declarationContact: true
};

const CS_SKILLS_OPTIONS = [
  { value: 'Inbound phone call answering & greeting', label: 'Inbound phone call answering & polite greeting (ইনবাউন্ড কল গ্রহণ ও শুভেচ্ছা বিনিময়)' },
  { value: 'Outbound courtesy & follow-up calls', label: 'Outbound courtesy & follow-up calls (আউটবাউন্ড কল ও ফলো-আপ)' },
  { value: 'Active listening & empathetic query resolution', label: 'Active listening & empathetic query resolution (মনোযোগ দিয়ে শোনা ও সহমর্মিতাপূর্ণ সমাধান)' },
  { value: 'WhatsApp Business and Live Chat support', label: 'WhatsApp Business & Live Chat instant messaging support (হোয়াটসঅ্যাপ ও চ্যাট সাপোর্ট)' },
  { value: 'Client appointment scheduling for lawyers & consultants', label: 'Client appointment scheduling (আইনজীবী ও উপদেষ্টাদের শিডিউলিং)' },
  { value: 'Professional telephone etiquette & polite tone', label: 'Professional telephone etiquette & polite tone (মার্জিত টেলিফোন এটিকেট)' },
  { value: 'Handling difficult customer queries calmly', label: 'Handling difficult customer queries calmly (ধৈর্যসহকারে গ্রাহকের সমস্যার সমাধান)' },
  { value: 'Clear briefing on legal & accounting services', label: 'Clear briefing on firm legal & accounts services (সেবা সংক্রান্ত প্রাথমিক তথ্য প্রদান)' },
  { value: 'CRM & Client Log maintenance', label: 'CRM & Client communication log maintenance (কল ও ক্লায়েন্ট রেকর্ড সংরক্ষণ)' },
  { value: 'Willing to learn fast under senior supervision', label: 'Fresh candidate willing to learn fast under senior supervision (দ্রুত শেখার মানসিকতা)' }
];

const COMPUTER_SKILLS_OPTIONS = [
  { value: 'Microsoft Office (Word, Excel)', label: 'Microsoft Office (Word, Excel, PowerPoint)' },
  { value: 'Google Workspace (Docs, Sheets, Gmail, Drive)', label: 'Google Workspace (Docs, Sheets, Gmail, Drive, Calendar)' },
  { value: 'WhatsApp Business Web / Desktop', label: 'WhatsApp Business Web / Desktop messaging' },
  { value: 'Fast web browsing & CRM data entry', label: 'Fast web browsing & CRM data entry' },
  { value: 'Bengali & English keyboard typing', label: 'Bengali (Bijoy/Avro) & English keyboard typing' },
  { value: 'Email drafting & professional correspondence', label: 'Email drafting & formal correspondence' },
  { value: 'Basic computer troubleshooting', label: 'Basic computer troubleshooting & internet navigation' }
];

const FLUENCY_OPTIONS = [
  { value: '5 - Native / Fluent', label: '5 - Native / Fluent (অনর্গল ও সুস্পষ্ট)' },
  { value: '4 - Good Working Proficiency', label: '4 - Good Working Proficiency (ভালো ও সাবলীল)' },
  { value: '3 - Moderate / Conversational', label: '3 - Moderate / Conversational (চলনসই কথোপকথন)' },
  { value: '2 - Basic Understanding', label: '2 - Basic Understanding (প্রাথমিক ধারণা)' }
];

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type TabMode = 'circular' | 'apply';

export const CareerCustomerCarePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'apply' ? 'apply' : 'circular';
  const [activeTab, setActiveTab] = useState<TabMode>(initialTab);

  const [formState, setFormState] = useState<CustomerCareFormState>(() => {
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

  const [academicDocs, setAcademicDocs] = useState<FileMeta[]>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.academicDocs)) return parsed.academicDocs;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [cvError, setCvError] = useState<string>('');
  const [docsError, setDocsError] = useState<string>('');
  const [isPreviewVisible, setIsPreviewVisible] = useState<boolean>(false);
  const [applicationRefId, setApplicationRefId] = useState<string>('');
  const [generatedAtLabel, setGeneratedAtLabel] = useState<string>('');
  const [generatedIso, setGeneratedIso] = useState<string>('');
  const [actionFeedback, setActionFeedback] = useState<string>('');
  const [errorSummary, setErrorSummary] = useState<string>('');
  const [missingFieldsList, setMissingFieldsList] = useState<string[]>([]);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState<boolean>(false);
  const [isSubmittedToHr, setIsSubmittedToHr] = useState<boolean>(false);
  const [copiedRefId, setCopiedRefId] = useState<boolean>(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState<boolean>(false);

  // Accordion section open/collapse states
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
      // Storage full or unavailable
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

  const handleInputChange = <K extends keyof CustomerCareFormState>(
    field: K,
    value: CustomerCareFormState[K]
  ) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleCsSkill = (skill: string) => {
    setFormState(prev => {
      const exists = prev.customerServiceSkills.includes(skill);
      const updated = exists
        ? prev.customerServiceSkills.filter(s => s !== skill)
        : [...prev.customerServiceSkills, skill];
      return { ...prev, customerServiceSkills: updated };
    });
  };

  const toggleComputerSkill = (tool: string) => {
    setFormState(prev => {
      const exists = prev.computerSkills.includes(tool);
      const updated = exists
        ? prev.computerSkills.filter(t => t !== tool)
        : [...prev.computerSkills, tool];
      return { ...prev, computerSkills: updated };
    });
  };

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCvError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      setCvError(`File size exceeds 10MB limit (${formatBytes(file.size)}). Please choose a smaller PDF/DOC file.`);
      if (cvInputRef.current) cvInputRef.current.value = '';
      return;
    }

    const validExts = ['.pdf', '.doc', '.docx'];
    const lowerName = file.name.toLowerCase();
    const isAllowed = validExts.some(ext => lowerName.endsWith(ext));
    if (!isAllowed) {
      setCvError('Please upload your CV in PDF or DOC/DOCX format.');
      if (cvInputRef.current) cvInputRef.current.value = '';
      return;
    }

    setCvFile({
      fileName: file.name,
      fileType: file.type || 'application/pdf',
      sizeBytes: file.size
    });
    showActionFeedback(`Attached CV: ${file.name} (${formatBytes(file.size)})`);
  };

  const handleRemoveCv = () => {
    setCvFile(null);
    setCvError('');
    if (cvInputRef.current) cvInputRef.current.value = '';
    showActionFeedback('CV attachment removed.');
  };

  const handleDocsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocsError('');
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validNewDocs: FileMeta[] = [];
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const rejectedMessages: string[] = [];

    for (const f of files) {
      if (f.size > MAX_FILE_BYTES) {
        rejectedMessages.push(`"${f.name}" exceeds the 10MB limit and was skipped.`);
        continue;
      }

      const lowerName = f.name.toLowerCase();
      if (!allowedExtensions.some(ext => lowerName.endsWith(ext))) {
        rejectedMessages.push(`"${f.name}" is not a supported file type. Use PDF, DOC, or DOCX.`);
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

  const handleRemoveDoc = (index: number) => {
    setAcademicDocs(prev => prev.filter((_, i) => i !== index));
  };

  // Progress computation
  const formProgress = useMemo(() => {
    const requiredCheckpoints = [
      Boolean(formState.fullName.trim()),
      Boolean(formState.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)),
      Boolean(formState.phone.trim()),
      Boolean(formState.address.trim()),
      Boolean(formState.location.trim()),
      Boolean(formState.highestQualification),
      Boolean(formState.degreeProgram.trim()),
      Boolean(formState.institution.trim()),
      Boolean(formState.graduationYear),
      Boolean(formState.spokenBengaliFluency),
      Boolean(formState.spokenEnglishFluency),
      formState.customerServiceSkills.length >= 1,
      formState.computerSkills.length >= 1,
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
    if (!formState.degreeProgram.trim()) missing.push('Degree / Department / Group (ডিগ্রি বা বিভাগ)');
    if (!formState.institution.trim()) missing.push('College / University Institution Name (শিক্ষা প্রতিষ্ঠান)');
    if (!formState.graduationYear) missing.push('Passing / Graduation Year (পাসের সাল)');

    if (!formState.salary.trim()) missing.push('Expected Monthly Salary (বেতন প্রত্যাশা)');
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
      fileName: 'Farhana_Yasmin_Customer_Care_CV.pdf',
      fileType: 'application/pdf',
      sizeBytes: 485000
    });
    setAcademicDocs([
      { fileName: 'BA_Honours_Transcript_Farhana.pdf', fileType: 'application/pdf', sizeBytes: 820000 },
      { fileName: 'Customer_Service_Training_Certificate.pdf', fileType: 'application/pdf', sizeBytes: 310000 }
    ]);
    setCvError('');
    setDocsError('');
    setErrorSummary('');
    setMissingFieldsList([]);
    expandAllSections();
    showActionFeedback('Sample candidate profile loaded! You can now review, preview, or test submission.');
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
    const ref = `ELAW-CCE-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setApplicationRefId(ref);
    setGeneratedAtLabel(now.toLocaleString());
    setGeneratedIso(now.toISOString());
    setIsPreviewVisible(true);

    setTimeout(() => {
      previewCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

    showActionFeedback(`Application Preview generated! Reference ID: ${ref}`);
  };

  const previewRows = useMemo(() => {
    return [
      { keyLabel: 'Position & Title', valueText: 'Customer Care Executive – Female (Accounts & Legal Desk)' },
      { keyLabel: 'Department', valueText: 'Customer Care / Call Center Division' },
      { keyLabel: 'Applicant Full Name', valueText: formState.fullName },
      { keyLabel: 'Email Address', valueText: formState.email },
      { keyLabel: 'Mobile / WhatsApp', valueText: `${formState.phone} ${formState.whatsapp ? `(WhatsApp: ${formState.whatsapp})` : ''}` },
      { keyLabel: 'Present Address & City', valueText: `${formState.address}, ${formState.location}` },
      { keyLabel: 'LinkedIn / Social Link', valueText: formState.linkedin || 'Not provided' },
      { keyLabel: 'Highest Qualification', valueText: `${formState.highestQualification} — ${formState.degreeProgram}` },
      { keyLabel: 'Major / Subject & College', valueText: `${formState.major ? `${formState.major} at ` : ''}${formState.institution}` },
      { keyLabel: 'Graduation Year & Result', valueText: `${formState.graduationYear} (Result: ${formState.academicResult || 'Pass'})` },
      { keyLabel: 'Currently Enrolled / Studying', valueText: formState.currentlyStudying || 'No' },
      { keyLabel: 'Spoken Bengali Fluency', valueText: formState.spokenBengaliFluency },
      { keyLabel: 'Spoken English Fluency', valueText: formState.spokenEnglishFluency },
      { keyLabel: 'Voice Clarity & Tone', valueText: formState.voiceClarity },
      { keyLabel: 'Customer Service Competencies', valueText: formState.customerServiceSkills.join('; ') },
      { keyLabel: 'Computer / Office Tools', valueText: formState.computerSkills.join('; ') },
      { keyLabel: 'Typing Speed', valueText: formState.typingSpeed || 'Standard typing proficiency' },
      { keyLabel: 'Additional Skills Note', valueText: formState.skillsDetails || 'None provided' },
      { keyLabel: 'Work Experience Profile', valueText: `${formState.workExperience} ${formState.experienceLength ? `(${formState.experienceLength})` : ''}` },
      { keyLabel: 'Prior Employer & Role', valueText: formState.organization ? `${formState.organization} — ${formState.jobTitle || 'Customer Representative'}` : 'Fresher / Entry Candidate' },
      { keyLabel: 'Key Responsibilities', valueText: formState.responsibilities || 'Entry level, ready for training' },
      { keyLabel: 'Training / Certification', valueText: formState.training === 'Yes' ? formState.trainingDetails || 'Customer Care / BPO Course' : 'None' },
      { keyLabel: 'Full-Time Commitment', valueText: formState.fullTime },
      { keyLabel: 'Earliest Joining Date', valueText: formState.joinTime },
      { keyLabel: 'Workplace Acceptance (Panthapath)', valueText: formState.officeLocation },
      { keyLabel: 'Expected Salary (Monthly BDT)', valueText: `BDT ${Number(formState.salary || 0).toLocaleString()} (Negotiable)` },
      { keyLabel: 'Attached CV / Resume', valueText: cvFile ? `${cvFile.fileName} (${formatBytes(cvFile.sizeBytes)})` : 'Not attached' },
      { keyLabel: 'Supporting Documents', valueText: academicDocs.length ? academicDocs.map(d => d.fileName).join(', ') : 'None attached' },
      { keyLabel: 'Candidate Motivation', valueText: formState.motivation }
    ];
  }, [formState, cvFile, academicDocs]);

  const handleDownloadJson = () => {
    const exportObject = {
      firm: 'E-Lawyers Legal & Business Consultancy Firm',
      division: 'Customer Care / Call Center',
      position: 'Customer Care Executive – Female',
      applicationRefId,
      submissionTimestamp: generatedIso || new Date().toISOString(),
      personalInformation: {
        fullName: formState.fullName,
        email: formState.email,
        phone: formState.phone,
        whatsapp: formState.whatsapp,
        address: formState.address,
        location: formState.location,
        linkedin: formState.linkedin
      },
      educationalBackground: {
        highestQualification: formState.highestQualification,
        degreeProgram: formState.degreeProgram,
        major: formState.major,
        institution: formState.institution,
        graduationYear: formState.graduationYear,
        academicResult: formState.academicResult,
        currentlyStudying: formState.currentlyStudying
      },
      skillsAndCompetencies: {
        spokenBengaliFluency: formState.spokenBengaliFluency,
        spokenEnglishFluency: formState.spokenEnglishFluency,
        voiceClarity: formState.voiceClarity,
        customerServiceSkills: formState.customerServiceSkills,
        computerSkills: formState.computerSkills,
        typingSpeed: formState.typingSpeed,
        skillsDetails: formState.skillsDetails
      },
      experienceAndBackground: {
        workExperience: formState.workExperience,
        experienceLength: formState.experienceLength,
        organization: formState.organization,
        jobTitle: formState.jobTitle,
        responsibilities: formState.responsibilities,
        training: formState.training,
        trainingDetails: formState.trainingDetails
      },
      availabilityAndSalary: {
        fullTime: formState.fullTime,
        joinTime: formState.joinTime,
        officeLocation: formState.officeLocation,
        salaryMonthlyBdt: formState.salary,
        noticePeriod: formState.noticePeriod
      },
      attachments: {
        cvFile,
        academicDocs
      },
      motivationStatement: formState.motivation
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `E-Lawyers_CustomerCare_${applicationRefId || 'Application'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showActionFeedback('Application data downloaded as JSON file.');
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
      const margin = 36;
      const contentWidth = pageWidth - margin * 2;

      // Navy Header Banner
      doc.setFillColor(16, 36, 58);
      doc.rect(0, 0, pageWidth, 110, 'F');

      // Gold Accent Line
      doc.setFillColor(199, 167, 107);
      doc.rect(0, 110, pageWidth, 4, 'F');

      doc.setTextColor(221, 195, 143);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('E-LAWYERS · LEGAL & BUSINESS CONSULTANCY FIRM', margin, 30);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('Customer Care Executive (Female) — Job Application', margin, 54);

      doc.setTextColor(214, 226, 235);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(
        `Reference ID: ${applicationRefId}   |   Division: Customer Care / Call Center   |   Location: Panthapath, Dhaka`,
        margin,
        74
      );
      doc.text(
        `Generated On: ${generatedAtLabel || new Date().toLocaleString()}`,
        margin,
        90
      );

      let y = 132;

      previewRows.forEach((row, index) => {
        const keyLines = doc.splitTextToSize(row.keyLabel, 150);
        const valLines = doc.splitTextToSize(row.valueText || '—', contentWidth - 165);
        const rowHeight = Math.max(keyLines.length, valLines.length) * 12 + 10;

        if (y + rowHeight > pageHeight - 55) {
          doc.addPage();
          y = 40;
        }

        if (index % 2 === 0) {
          doc.setFillColor(247, 249, 251);
          doc.rect(margin, y, contentWidth, rowHeight, 'F');
        }

        doc.setDrawColor(223, 230, 236);
        doc.rect(margin, y, contentWidth, rowHeight, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(41, 59, 78);
        doc.text(keyLines, margin + 6, y + 14);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(36, 52, 70);
        doc.text(valLines, margin + 160, y + 14);

        y += rowHeight;
      });

      if (y + 40 > pageHeight - 30) {
        doc.addPage();
        y = 40;
      }
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(104, 120, 138);
      doc.text(
        'E-Lawyers Legal & Business Consultancy Firm · G-5, BTI Centara Grand, 144-144/1 Green Road, Panthapath, Dhaka-1205',
        margin,
        pageHeight - 20
      );

      doc.save(`E-Lawyers_Customer_Care_${applicationRefId || 'Application'}.pdf`);
      showActionFeedback('Saved PDF copy (E-Lawyers_Customer_Care_Application.pdf)');
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
    const currentRefId = applicationRefId || `ELAW-CCE-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setApplicationRefId(currentRefId);
    setGeneratedAtLabel(now.toLocaleString());
    setGeneratedIso(now.toISOString());

    const candidatePayload: CareerApplicationData & Record<string, any> = {
      applicationRefId: currentRefId,
      position: 'Customer Care Executive (Female)',
      department: 'Customer Care / Call Center',
      fullName: formState.fullName.trim(),
      email: formState.email.trim(),
      phone: formState.phone.trim(),
      whatsapp: formState.whatsapp.trim(),
      address: formState.address.trim(),
      location: formState.location.trim(),
      linkedin: formState.linkedin.trim(),
      highestQualification: formState.highestQualification,
      degreeProgram: formState.degreeProgram.trim(),
      major: formState.major.trim() || 'General Studies',
      institution: formState.institution.trim(),
      graduationYear: formState.graduationYear,
      academicResult: formState.academicResult.trim() || 'Passed',
      currentlyStudying: formState.currentlyStudying || 'No',
      customerServiceSkills: formState.customerServiceSkills.length > 0 ? formState.customerServiceSkills : ['Inbound phone call answering & greeting'],
      computerSkills: formState.computerSkills.length > 0 ? formState.computerSkills : ['Microsoft Office (Word, Excel)'],
      englishFluency: formState.spokenEnglishFluency || '4 - Good Working Proficiency',
      bengaliFluency: formState.spokenBengaliFluency || '5 - Native / Fluent',
      typingSpeed: formState.typingSpeed || 'Standard',
      voiceClarity: formState.voiceClarity || 'Clear & Professional',
      skillsDetails: formState.skillsDetails.trim(),
      workExperience: formState.workExperience || 'Fresh Candidate',
      experienceLength: formState.experienceLength,
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
      cvFileSize: cvFile?.sizeBytes || 450000,
      academicDocsSummary: academicDocs.map(d => `${d.fileName} (${Math.round(d.sizeBytes / 1024)} KB)`).join(', '),
      portfolio: formState.portfolio.trim(),
      motivation: formState.motivation.trim() || 'Interested in joining E-Lawyers as Customer Care Executive.',
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
        title="Customer Care Executive (Female) | E-Lawyers Job Circular & Online Application"
        description="E-Lawyers Legal & Business Consultancy Firm is hiring 2 Female Customer Care Executives for our Panthapath, Dhaka office. Minimum HSC or Graduate. Apply online with ease."
        canonicalUrl="/Careers/customer-care"
        serviceType="Job Recruitment Posting & Application"
      />

      {/* Hero Header - Light Corporate Theme */}
      <section className="bg-gradient-to-b from-white via-[#f8fafc] to-[#f1f5f9] text-slate-800 pt-10 pb-16 px-4 border-b border-slate-200 relative overflow-hidden">
        {/* Subtle ultra-light background accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-200/15 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="max-w-5xl mx-auto relative z-10">
          {/* Top navigation row */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white border-2 border-amber-400/40 flex items-center justify-center font-extrabold text-[#c7a76b] text-lg shadow-xs">
                ELA
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-widest text-[#10243a] uppercase">
                  E-Lawyers Legal &amp; Business Consultancy Firm
                </h2>
                <p className="text-xs text-slate-500 font-medium">Customer Care &amp; Call Center Division · Panthapath, Dhaka</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <Link
                to="/Careers/mto"
                className="text-xs bg-white hover:bg-slate-50 text-slate-700 hover:text-[#10243a] px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>MTO Trainee Opening</span>
              </Link>
              <Link
                to="/Careers/sales-marketing"
                className="text-xs bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-800 px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 font-semibold"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sales &amp; Marketing</span>
              </Link>
              <Link
                to="/Careers/accountant"
                className="text-xs bg-white hover:bg-slate-50 text-slate-700 hover:text-[#10243a] px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 font-semibold"
              >
                <Briefcase className="w-3.5 h-3.5 text-[#167d83]" />
                <span>Accountant (2)</span>
              </Link>
              <Link
                to="/Careers"
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> All Openings
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-8">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold mb-3 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" /> Official Career Circular · 2026 Recruitment
              </div>

              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#10243a] mb-3">
                Customer Care Executive (Female)
              </h1>
              <p className="text-lg md:text-xl text-slate-600 max-w-3xl mb-6 leading-relaxed">
                কাস্টমার কেয়ার ও কল সেন্টারে উজ্জ্বল ক্যারিয়ার গড়ুন। আপনার আত্মবিশ্বাস, মার্জিত বাচনভঙ্গি ও যোগাযোগ দক্ষতাকে কাজে লাগিয়ে E-Lawyers-এর ক্লায়েন্টদের বিশ্বস্ত সেবা দিন।
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleTabChange('apply')}
                  className="px-6 py-3 bg-gradient-to-r from-[#10243a] to-[#1c3c5d] hover:to-[#224b74] text-amber-300 font-black rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 text-sm border border-amber-400/40 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Apply Online Now (অনলাইন আবেদন)</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl overflow-hidden border-2 border-slate-200/90 shadow-lg bg-white">
                <img
                  src="https://i.ibb.co/Kz0BfBPn/65a0c170-51c2-4122-8430-e881e995471f.png"
                  alt="Customer Care Executive (Female) Recruitment Circular - E-Lawyers Legal & Business Consultancy Firm"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>

          {/* Key metadata badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 text-center shadow-xs">
              <Users className="w-4 h-4 mx-auto text-[#167d83] mb-1" />
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Vacancies</div>
              <div className="text-sm font-bold text-[#10243a]">2 Positions (Female)</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-3 text-center shadow-xs">
              <GraduationCap className="w-4 h-4 mx-auto text-[#167d83] mb-1" />
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Qualification</div>
              <div className="text-sm font-bold text-[#10243a]">Min. HSC / Graduate</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-3 text-center shadow-xs">
              <Briefcase className="w-4 h-4 mx-auto text-[#167d83] mb-1" />
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Experience</div>
              <div className="text-sm font-bold text-[#10243a]">Freshers Welcome</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-3 text-center shadow-xs">
              <MapPin className="w-4 h-4 mx-auto text-[#167d83] mb-1" />
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Location</div>
              <div className="text-sm font-bold text-[#10243a]">Panthapath, Dhaka</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-3 text-center shadow-xs">
              <Award className="w-4 h-4 mx-auto text-[#167d83] mb-1" />
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Salary</div>
              <div className="text-sm font-bold text-emerald-700">Negotiable</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-3 text-center shadow-xs">
              <Calendar className="w-4 h-4 mx-auto text-amber-600 mb-1" />
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Deadline</div>
              <div className="text-sm font-bold text-amber-700">31 October 2026</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
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
                  ? 'bg-[#167d83] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-300" />
              <span>Apply Online (আবেদন ফর্ম)</span>
              <span className="ml-1 bg-amber-400 text-[#10243a] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {formProgress}%
              </span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 pr-2 text-xs text-slate-500">
            <Headphones className="w-4 h-4 text-[#167d83]" />
            <span>Direct Desk: +880 1313-583838</span>
          </div>
        </div>

        {/* Global Action Feedback Notification */}
        {actionFeedback && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm flex items-center gap-3 shadow-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{actionFeedback}</span>
          </div>
        )}

        {/* TAB 1: JOB CIRCULAR / বিজ্ঞপ্তি */}
        {activeTab === 'circular' && (
          <div className="space-y-8 animate-fade-in">
            {/* Urgent Notice Banner */}
            <div className="bg-[#fffaf0] border border-[#ead9b4] border-l-4 border-l-[#c7a76b] rounded-xl p-5 text-slate-800 shadow-sm">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#c7a76b] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-base text-[#10243a] mb-1">
                    জরুরি বিজ্ঞপ্তি: দ্রুত আবেদন করুন (Women Empowerment in Corporate Services)
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    E-Lawyers Legal &amp; Business Consultancy Firm-এ নারী প্রার্থীদের কর্মসংস্থান ও ক্যারিয়ার বিকাশে বিশেষ গুরুত্ব দেওয়া হয়। যোগ্যতা ও বাচনভঙ্গিসম্পন্ন আগ্রহী নারী প্রার্থীরা অনলাইনের মাধ্যমে সহজে আবেদনপত্র জমা দিতে পারবেন।
                  </p>
                </div>
              </div>
            </div>

            {/* Overview Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
              <div className="mb-6 rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
                <img
                  src="https://i.ibb.co/Tqqn8XBt/309a5625-b84f-4412-9326-1c2dd526b57d.png"
                  alt="Customer Care Executive (Female) Recruitment Notice - E-Lawyers Legal & Business Consultancy Firm"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-cover"
                />
              </div>

              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-2.5 rounded-xl bg-[#10243a]/5 text-[#10243a]">
                  <Building2 className="w-6 h-6 text-[#10243a]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#10243a]">প্রতিষ্ঠানের পরিচিতি ও নিয়োগ প্রেক্ষাপট</h3>
                  <p className="text-xs text-slate-500">About E-Lawyers Legal &amp; Business Consultancy Firm</p>
                </div>
              </div>

              <div className="prose max-w-none text-slate-700 text-sm md:text-base leading-relaxed space-y-4">
                <p>
                  <strong>E-Lawyers Legal &amp; Business Consultancy Firm</strong> একটি সুপ্রতিষ্ঠিত ও বিশ্বস্ত পরামর্শক প্রতিষ্ঠান, যা ব্যক্তি ও প্রাতিষ্ঠানিক ক্লায়েন্টদের আইনি ও ব্যবসায়িক সমাধানের সেবা দিয়ে আসছে। আমাদের কার্যক্রম প্রধানত দুটি ধারায় পরিচালিত হয়:
                </p>
                <div className="grid md:grid-cols-2 gap-4 my-4 not-prose">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h5 className="font-bold text-[#10243a] text-sm mb-1">১. লিগ্যাল ডিভিশন (Legal Division)</h5>
                    <p className="text-xs text-slate-600 leading-normal">
                      আদালত পরিচালনা, দেওয়ানি ও ফৌজদারি মামলা, কর্পোরেট ল, আরজেএসসি (RJSC) কোম্পানি নিবন্ধন এবং চুক্তিপত্র প্রণয়ন।
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h5 className="font-bold text-[#10243a] text-sm mb-1">২. অ্যাকাউন্টস ডিভিশন (Accounts Division)</h5>
                    <p className="text-xs text-slate-600 leading-normal">
                      ব্যবসায়িক প্রতিষ্ঠানের বুককিপিং, ইনকাম ট্যাক্স রিটার্ন (ITA 2023), ভ্যাট ও মূসক-৯.১ কমপ্লায়েন্স ও আর্থিক পরামর্শ।
                    </p>
                  </div>
                </div>
                <p>
                  প্রতিদিন দেশ ও দেশের বাইরের শত শত গ্রাহক ফোন, হোয়াটসঅ্যাপ এবং ইমেইলের মাধ্যমে আমাদের সেবা সম্পর্কে জানতে চান। তাই আমাদের কল সেন্টার ও কাস্টমার কেয়ার টিমকে আরও গতিশীল ও গ্রাহকবান্ধব করতে <strong>২ জন আন্তরিক, ধৈর্যশীল ও কর্মঠ Female Customer Care Executive</strong> নিয়োগ দেওয়া হচ্ছে।
                </p>
              </div>
            </div>

            {/* Responsibilities Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-2.5 rounded-xl bg-[#167d83]/10 text-[#167d83]">
                  <Headphones className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#10243a]">মূল দায়িত্ব ও কাজের পরিধি (Core Responsibilities)</h3>
                  <p className="text-xs text-slate-500">Day-to-day role &amp; performance expectations</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  {
                    title: 'ইনবাউন্ড কল গ্রহণ ও ভদ্রভাবে সম্ভাষণ',
                    desc: 'গ্রাহকদের ফোন কল রিসিভ করা, সালাম/শুভেচ্ছা বিনিময় করা এবং তাঁদের প্রশ্নের মনোযোগ দিয়ে উত্তর দেওয়া।'
                  },
                  {
                    title: 'সেবা সংক্রান্ত সঠিক তথ্য প্রদান',
                    desc: 'কোম্পানি নিবন্ধন, ট্যাক্স-ভ্যাট ফাইলিং এবং লিগ্যাল পরামর্শ সংক্রান্ত প্রাথমিক তথ্য গ্রাহকের কাছে সহজে বুঝিয়ে বলা।'
                  },
                  {
                    title: 'অ্যাপয়েন্টমেন্ট শিডিউলিং ও সমন্বয়',
                    desc: 'গ্রাহকের সুবিধাজনক সময়ে ফার্মের আইনজীবী ও সিনিয়র অ্যাকাউন্টস কনসালট্যান্টদের সাথে কনসালটেশন অ্যাপয়েন্টমেন্ট বুক করা।'
                  },
                  {
                    title: 'হোয়াটসঅ্যাপ ও ডিজিটাল মেসেজিং সাপোর্ট',
                    desc: 'অফিসিয়াল হোয়াটসঅ্যাপ, ফেসবুক পেজ ও লাইভ চ্যাটে আসা বার্তার দ্রুত ও পেশাদার উত্তর প্রদান।'
                  },
                  {
                    title: 'আউটবাউন্ড কল ও ক্লায়েন্ট ফলো-আপ',
                    desc: 'আগের যোগাযোগ করা ক্লায়েন্টদের সার্ভিস আপডেট দেওয়া এবং প্রয়োজনীয় কাগজপত্র সংগ্রহে ফলো-আপ কল করা।'
                  },
                  {
                    title: 'কল লগ ও সিআরএম (CRM) রেকর্ড সংরক্ষণ',
                    desc: 'দৈনিক কল বিবরণী ও গ্রাহকের যোগাযোগের তথ্য এক্সেল শিট বা সফটওয়্যারে সঠিকভাবে এন্ট্রি দেওয়া।'
                  }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3 p-3.5 rounded-xl border border-slate-100 bg-[#fbfcfd] hover:border-teal-200 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-[#10243a] mb-0.5">{item.title}</h5>
                      <p className="text-xs text-slate-600 leading-normal">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Qualifications & Requirements Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
                  <Award className="w-6 h-6 text-[#c7a76b]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#10243a]">প্রয়োজনীয় শিক্ষাগত যোগ্যতা ও দক্ষতা (Requirements)</h3>
                  <p className="text-xs text-slate-500">Eligibility criteria for female candidates</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60">
                  <h5 className="font-bold text-[#10243a] text-sm mb-2 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#c7a76b]" />
                    শিক্ষাগত যোগ্যতা (Educational Background):
                  </h5>
                  <ul className="text-xs md:text-sm text-slate-700 space-y-1.5 list-disc list-inside">
                    <li>ন্যূনতম <strong>HSC বা সমমান পাস</strong>। যেকোনো বিষয়ে স্নাতক (Honours / Degree / BBA / English) অধ্যয়নরত বা সম্পন্নকারী প্রার্থীরা অগ্রাধিকার পাবেন।</li>
                    <li>সদ্য পাস করা ফ্রেশার (Freshers) যারা আত্মবিশ্বাসী ও কথা বলতে ভালোবাসেন, তারাও আবেদন করতে পারেন।</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h5 className="font-bold text-[#10243a] text-sm mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#167d83]" />
                    যোগাযোগ ও বাচনভঙ্গি (Communication Skills):
                  </h5>
                  <ul className="text-xs md:text-sm text-slate-700 space-y-1.5 list-disc list-inside">
                    <li>স্পষ্ট, শুদ্ধ ও মিষ্টভাষী বাচনভঙ্গি।</li>
                    <li>বাংলায় সাবলীল কথা বলার পাশাপাশি ইংরেজিতে সাধারণ বার্তা বোঝা ও উত্তর দেওয়ার সক্ষমতা।</li>
                    <li>ধৈর্যশীল মনোভাব এবং ক্লায়েন্টকে সম্মান প্রদর্শনের স্বাভাবিক প্রবৃত্তি।</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h5 className="font-bold text-[#10243a] text-sm mb-2 flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-[#10243a]" />
                    কম্পিউটার ও প্রযুক্তিগত জ্ঞান (Computer Skills):
                  </h5>
                  <ul className="text-xs md:text-sm text-slate-700 space-y-1.5 list-disc list-inside">
                    <li>কম্পিউটারে প্রাথমিক কাজ জানা (MS Word, Excel, Google Docs &amp; Sheets)।</li>
                    <li>হোয়াটসঅ্যাপ বিজনেস ও ইমেইল দ্রুত টাইপ ও সেন্ড করার দক্ষতা।</li>
                    <li>ইন্টারনেট ব্রাউজিং ও তথ্য খোঁজার পারদর্শিতা।</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Compensation & Benefits Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
              <h3 className="text-xl font-bold text-[#10243a] mb-4">বেতন ও অন্যান্য সুবিধাসমূহ (Compensation &amp; Benefits)</h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#f7f9fb] border border-slate-200 text-center">
                  <div className="text-xs font-semibold text-slate-500 mb-1">মাসিক বেতন</div>
                  <div className="text-base font-bold text-[#10243a]">আলোচনা সাপেক্ষে</div>
                  <div className="text-[11px] text-slate-500 mt-1">যোগ্যতা ও অভিজ্ঞতার ভিত্তিতে</div>
                </div>

                <div className="p-4 rounded-xl bg-[#f7f9fb] border border-slate-200 text-center">
                  <div className="text-xs font-semibold text-slate-500 mb-1">উৎসব বোনাস</div>
                  <div className="text-base font-bold text-emerald-700">বার্ষিক ২টি উৎসব বোনাস</div>
                  <div className="text-[11px] text-slate-500 mt-1">কোম্পানি পলিসি অনুযায়ী</div>
                </div>

                <div className="p-4 rounded-xl bg-[#f7f9fb] border border-slate-200 text-center">
                  <div className="text-xs font-semibold text-slate-500 mb-1">কর্মপরিবেশ</div>
                  <div className="text-base font-bold text-teal-800">নিরাপদ ও নারী-বান্ধব</div>
                  <div className="text-[11px] text-slate-500 mt-1">পেশাদার করপোরেট পরিবেশ</div>
                </div>

                <div className="p-4 rounded-xl bg-[#f7f9fb] border border-slate-200 text-center">
                  <div className="text-xs font-semibold text-slate-500 mb-1">ক্যারিয়ার গ্রোথ</div>
                  <div className="text-base font-bold text-[#10243a]">সিনিয়র পজিশনে পদোন্নতি</div>
                  <div className="text-[11px] text-slate-500 mt-1">পারফরম্যান্স রিওয়ার্ডস</div>
                </div>
              </div>
            </div>

            {/* Workplace Location & Contact Information */}
            <div className="bg-gradient-to-br from-[#10243a] to-[#173750] text-white rounded-2xl p-6 md:p-8 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h4 className="text-lg font-bold text-[#ddc38f] mb-2 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    অফিস লোকেশন ও যোগাযোগ
                  </h4>
                  <p className="text-sm text-slate-200 leading-relaxed max-w-xl">
                    <strong>E-Lawyers Legal &amp; Business Consultancy Firm</strong><br />
                    G-5, BTI Centara Grand, 144–144/1 Green Road, Panthapath, Dhaka-1205, Bangladesh.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-300">
                    <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#ddc38f]" /> career@elawyersbd.com</span>
                    <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#ddc38f]" /> +880 1313-583838</span>
                  </div>
                </div>

                <button
                  onClick={() => handleTabChange('apply')}
                  className="px-8 py-4 bg-gradient-to-r from-[#c7a76b] to-[#b38e4a] hover:from-[#d5b67b] hover:to-[#c7a76b] text-[#10243a] font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
                >
                  <span>অনলাইনে আবেদন করুন</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE APPLICATION FORM / আবেদন ফর্ম */}
        {activeTab === 'apply' && (
          <div className="app-form-60 w-full lg:w-[60vw] mx-auto space-y-8 animate-fade-in">
            {/* Top Helper Strip */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-[#10243a] text-base flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-[#167d83]" />
                  Customer Care Executive (Female) — Online Application Form
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete all 8 sections below. Draft auto-saves to your browser.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFillSample}
                  className="text-xs px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Fill Sample Data (নমুনা তথ্য)
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmClearOpen(true)}
                  className="text-xs px-3.5 py-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-300 rounded-lg font-semibold transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear Form
                </button>
              </div>
            </div>

            {/* Progress Bar Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-[#10243a] mb-2">
                <span className="flex items-center gap-2">
                  <span>Application Progress</span>
                  <span className="text-[11px] font-normal text-slate-500">(আবেদনের অগ্রগতি)</span>
                </span>
                <span className="text-sm font-extrabold text-[#167d83]">{formProgress}% Complete</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                <div
                  className="bg-gradient-to-r from-[#167d83] to-[#10666b] h-full rounded-full transition-all duration-300"
                  style={{ width: `${formProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                <span>8 Collapsible Sections</span>
                <button
                  type="button"
                  onClick={expandAllSections}
                  className="text-teal-700 hover:underline font-semibold"
                >
                  Expand All Sections
                </button>
              </div>
            </div>

            {/* Error Summary Banner (if validation failed) */}
            {errorSummary && (
              <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-900 shadow-sm animate-fade-in">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h5 className="font-bold text-sm text-red-800">{errorSummary}</h5>
                    {missingFieldsList.length > 0 && (
                      <ul className="text-xs text-red-700 grid sm:grid-cols-2 gap-1 list-disc list-inside">
                        {missingFieldsList.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* The 8 Collapsible Form Accordions */}
            <form ref={formRef} onSubmit={handleSubmitApplicationAndNotifyHr} noValidate className="space-y-6">
              {/* SECTION 1: Personal Information */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleSection(1)}
                  className="w-full p-5 bg-slate-50/80 hover:bg-slate-100/80 border-b border-slate-200 text-left flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#10243a] text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <div>
                      <h4 className="font-bold text-base text-[#10243a]">Personal Information (ব্যক্তিগত তথ্য)</h4>
                      <p className="text-xs text-slate-500">Full name, active mobile number, present address &amp; contact info</p>
                    </div>
                  </div>
                  {openSections[1] ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>

                {openSections[1] && (
                  <div className="p-6 grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Full Name (পূর্ণ নাম) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="ccc-fullname"
                        name="name"
                        autoComplete="name"
                        type="text"
                        inputMode="text"
                        value={formState.fullName}
                        onChange={e => handleInputChange('fullName', e.target.value)}
                        placeholder="e.g. Farhana Yasmin"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Email Address (ইমেইল) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="ccc-email"
                        name="email"
                        autoComplete="email"
                        type="email"
                        inputMode="email"
                        value={formState.email}
                        onChange={e => handleInputChange('email', e.target.value)}
                        placeholder="e.g. candidate@example.com"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Contact Mobile Number (মোবাইল নম্বর) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="ccc-phone"
                        name="tel"
                        autoComplete="tel"
                        type="tel"
                        inputMode="tel"
                        value={formState.phone}
                        onChange={e => handleInputChange('phone', e.target.value)}
                        placeholder="e.g. 017XXXXXXXX"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        WhatsApp Number (হোয়াটসঅ্যাপ নম্বর)
                      </label>
                      <input
                        id="ccc-whatsapp"
                        name="whatsapp"
                        autoComplete="tel"
                        type="tel"
                        inputMode="tel"
                        value={formState.whatsapp}
                        onChange={e => handleInputChange('whatsapp', e.target.value)}
                        placeholder="e.g. 017XXXXXXXX"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Current City / Area (বর্তমান শহর/এলাকা) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="ccc-location"
                        name="address-level2"
                        autoComplete="address-level2"
                        type="text"
                        inputMode="text"
                        value={formState.location}
                        onChange={e => handleInputChange('location', e.target.value)}
                        placeholder="e.g. Panthapath / Dhanmondi / Dhaka"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Present Full Address (বর্তমান ঠিকানা) <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="ccc-address"
                        name="street-address"
                        autoComplete="street-address"
                        rows={2}
                        value={formState.address}
                        onChange={e => handleInputChange('address', e.target.value)}
                        placeholder="House / Road / Area, Dhaka"
                        required
                        className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        LinkedIn / Social Profile (ঐচ্ছিক)
                      </label>
                      <input
                        type="url"
                        inputMode="url"
                        value={formState.linkedin}
                        onChange={e => handleInputChange('linkedin', e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: Educational Qualifications */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleSection(2)}
                  className="w-full p-5 bg-slate-50/80 hover:bg-slate-100/80 border-b border-slate-200 text-left flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#10243a] text-white text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <div>
                      <h4 className="font-bold text-base text-[#10243a]">Educational Qualifications (শিক্ষাগত যোগ্যতা)</h4>
                      <p className="text-xs text-slate-500">Minimum HSC or Graduate in any discipline</p>
                    </div>
                  </div>
                  {openSections[2] ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>

                {openSections[2] && (
                  <div className="p-6 grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Highest Qualification Level (সর্বোচ্চ যোগ্যতা) <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formState.highestQualification}
                        onChange={e => handleInputChange('highestQualification', e.target.value)}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83] bg-white"
                      >
                        <option value="">-- নির্বাচন করুন --</option>
                        <option value="HSC / Alim (উচ্চ মাধ্যমিক)">HSC / Alim (উচ্চ মাধ্যমিক)</option>
                        <option value="Diploma">Diploma (ডিপ্লোমা)</option>
                        <option value="Bachelor Degree (Honours / Pass)">Bachelor Degree (Honours / Pass / BBA / BA / BSc)</option>
                        <option value="Masters Degree">Masters Degree (মাস্টার্স)</option>
                        <option value="Other">Other / সমমান</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Degree / Group / Program <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formState.degreeProgram}
                        onChange={e => handleInputChange('degreeProgram', e.target.value)}
                        placeholder="e.g. BA in English / BBA / Business Studies"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Major / Subject (বিভাগ)
                      </label>
                      <input
                        type="text"
                        value={formState.major}
                        onChange={e => handleInputChange('major', e.target.value)}
                        placeholder="e.g. English / Management / Humanities"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Institution / College / University Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formState.institution}
                        onChange={e => handleInputChange('institution', e.target.value)}
                        placeholder="e.g. Eden Mohila College / National University"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Passing / Graduation Year (পাসের সাল) <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formState.graduationYear}
                        onChange={e => handleInputChange('graduationYear', e.target.value)}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83] bg-white"
                      >
                        <option value="">-- সাল নির্বাচন করুন --</option>
                        {Array.from({ length: 12 }, (_, i) => String(2027 - i)).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Result / GPA / CGPA / Division
                      </label>
                      <input
                        type="text"
                        value={formState.academicResult}
                        onChange={e => handleInputChange('academicResult', e.target.value)}
                        placeholder="e.g. CGPA 3.40 / First Division"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Are you currently studying? (বর্তমানে কোথাও অধ্যয়নরত আছেন কি না?)
                      </label>
                      <div className="flex items-center gap-6 text-sm mt-1">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="currentlyStudying"
                            value="No"
                            checked={formState.currentlyStudying === 'No'}
                            onChange={e => handleInputChange('currentlyStudying', e.target.value)}
                            className="text-[#167d83] focus:ring-[#167d83]"
                          />
                          <span>No (পড়াশোনা শেষ)</span>
                        </label>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="currentlyStudying"
                            value="Yes"
                            checked={formState.currentlyStudying === 'Yes'}
                            onChange={e => handleInputChange('currentlyStudying', e.target.value)}
                            className="text-[#167d83] focus:ring-[#167d83]"
                          />
                          <span>Yes (অধ্যয়নরত, তবে ক্লাসের সাথে ফুলটাইম অফিসের সময় সমন্বয় করতে পারব)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: Communication & Customer Service Skills */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleSection(3)}
                  className="w-full p-5 bg-slate-50/80 hover:bg-slate-100/80 border-b border-slate-200 text-left flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#10243a] text-white text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <div>
                      <h4 className="font-bold text-base text-[#10243a]">Communication &amp; Customer Care Skills (যোগাযোগ ও গ্রাহক সেবা দক্ষতা)</h4>
                      <p className="text-xs text-slate-500">Fluency, listening, telephone etiquette, empathy &amp; resolving queries</p>
                    </div>
                  </div>
                  {openSections[3] ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>

                {openSections[3] && (
                  <div className="p-6 space-y-5">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Spoken Bengali Fluency <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formState.spokenBengaliFluency}
                          onChange={e => handleInputChange('spokenBengaliFluency', e.target.value)}
                          required
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83] bg-white"
                        >
                          {FLUENCY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Spoken English Fluency <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formState.spokenEnglishFluency}
                          onChange={e => handleInputChange('spokenEnglishFluency', e.target.value)}
                          required
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83] bg-white"
                        >
                          <option value="">-- ইংরেজি দক্ষতা নির্বাচন করুন --</option>
                          {FLUENCY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Voice Clarity &amp; Tone (বাচনভঙ্গি) <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formState.voiceClarity}
                          onChange={e => handleInputChange('voiceClarity', e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83] bg-white"
                        >
                          <option value="Clear & Professional">Clear, Polite &amp; Professional</option>
                          <option value="Very Good & Confident">Very Good &amp; Confident</option>
                          <option value="Moderate">Moderate, eager to improve</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Customer Service Competencies (যে যে কাজগুলো আপনি স্বাচ্ছন্দ্যে করতে পারেন - প্রযোজ্যগুলো টিক দিন) <span className="text-red-500">*</span>
                      </label>
                      <div className="grid sm:grid-cols-2 gap-2.5">
                        {CS_SKILLS_OPTIONS.map(opt => {
                          const isChecked = formState.customerServiceSkills.includes(opt.value);
                          return (
                            <label
                              key={opt.value}
                              className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-teal-50/80 border-[#167d83] text-[#10243a] font-medium'
                                  : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleCsSkill(opt.value)}
                                className="mt-0.5 rounded text-[#167d83] focus:ring-[#167d83]"
                              />
                              <span className="leading-tight">{opt.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 4: Computer & Digital Skills */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleSection(4)}
                  className="w-full p-5 bg-slate-50/80 hover:bg-slate-100/80 border-b border-slate-200 text-left flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#10243a] text-white text-xs font-bold flex items-center justify-center">
                      4
                    </span>
                    <div>
                      <h4 className="font-bold text-base text-[#10243a]">Computer &amp; Digital Skills (কম্পিউটার ও ডিজিটাল দক্ষতা)</h4>
                      <p className="text-xs text-slate-500">Typing speed, MS Office, Google Sheets, WhatsApp Business &amp; CRM</p>
                    </div>
                  </div>
                  {openSections[4] ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>

                {openSections[4] && (
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Software &amp; Digital Tools (টিক চিহ্ন দিন) <span className="text-red-500">*</span>
                      </label>
                      <div className="grid sm:grid-cols-2 gap-2.5">
                        {COMPUTER_SKILLS_OPTIONS.map(opt => {
                          const isChecked = formState.computerSkills.includes(opt.value);
                          return (
                            <label
                              key={opt.value}
                              className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-teal-50/80 border-[#167d83] text-[#10243a] font-medium'
                                  : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleComputerSkill(opt.value)}
                                className="mt-0.5 rounded text-[#167d83] focus:ring-[#167d83]"
                              />
                              <span className="leading-tight">{opt.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Keyboard Typing Speed (টাইপিং স্পিড)
                        </label>
                        <input
                          type="text"
                          value={formState.typingSpeed}
                          onChange={e => handleInputChange('typingSpeed', e.target.value)}
                          placeholder="e.g. English 35 WPM, Bangla 25 WPM"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Other Technical / Soft Skills
                        </label>
                        <input
                          type="text"
                          value={formState.skillsDetails}
                          onChange={e => handleInputChange('skillsDetails', e.target.value)}
                          placeholder="e.g. Canva design, data entry, CRM handling"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 5: Work Experience */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleSection(5)}
                  className="w-full p-5 bg-slate-50/80 hover:bg-slate-100/80 border-b border-slate-200 text-left flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#10243a] text-white text-xs font-bold flex items-center justify-center">
                      5
                    </span>
                    <div>
                      <h4 className="font-bold text-base text-[#10243a]">Work Experience (কাজের অভিজ্ঞতা)</h4>
                      <p className="text-xs text-slate-500">Call center, front desk or fresh graduate background</p>
                    </div>
                  </div>
                  {openSections[5] ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>

                {openSections[5] && (
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Do you have prior experience in Customer Support / Call Center? <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formState.workExperience}
                        onChange={e => handleInputChange('workExperience', e.target.value)}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83] bg-white"
                      >
                        <option value="">-- নির্বাচন করুন --</option>
                        <option value="Fresh Graduate / No prior experience">Fresh Graduate / No prior job experience (ফ্রেশার)</option>
                        <option value="Customer Care / Call Center experience (Less than 1 year)">Customer Care / Call Center experience (১ বছরের কম)</option>
                        <option value="Customer Care / Call Center experience (1-2 years)">Customer Care / Call Center experience (১-২ বছর)</option>
                        <option value="Customer Care experience (2+ years)">Customer Care experience (২+ বছর)</option>
                        <option value="Front Desk / Telemarketing / Other experience">Front Desk / Telemarketing / Admin experience</option>
                      </select>
                    </div>

                    {formState.workExperience && formState.workExperience !== 'Fresh Graduate / No prior experience' && (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid sm:grid-cols-2 gap-4 animate-fade-in">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Organization / Company Name (প্রতিষ্ঠানের নাম)
                          </label>
                          <input
                            type="text"
                            value={formState.organization}
                            onChange={e => handleInputChange('organization', e.target.value)}
                            placeholder="e.g. Apex BPO Solutions"
                            className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Job Title / Designation (পদবি)
                          </label>
                          <input
                            type="text"
                            value={formState.jobTitle}
                            onChange={e => handleInputChange('jobTitle', e.target.value)}
                            placeholder="e.g. Customer Care Representative"
                            className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Duration / Length of Service (কাজের সময়কাল)
                          </label>
                          <input
                            type="text"
                            value={formState.experienceLength}
                            onChange={e => handleInputChange('experienceLength', e.target.value)}
                            placeholder="e.g. 8 months"
                            className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Key Responsibilities Handled (মূল দায়িত্বসমূহ)
                          </label>
                          <textarea
                            rows={2}
                            value={formState.responsibilities}
                            onChange={e => handleInputChange('responsibilities', e.target.value)}
                            placeholder="Briefly describe what you did in your previous role..."
                            className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83]"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Have you completed any Customer Service / BPO Training?
                        </label>
                        <select
                          value={formState.training}
                          onChange={e => handleInputChange('training', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83] bg-white"
                        >
                          <option value="No">No (কোনো প্রশিক্ষণ নেই)</option>
                          <option value="Yes">Yes (প্রশিক্ষণ রয়েছে)</option>
                        </select>
                      </div>

                      {formState.training === 'Yes' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Training Details / Institute
                          </label>
                          <input
                            type="text"
                            value={formState.trainingDetails}
                            onChange={e => handleInputChange('trainingDetails', e.target.value)}
                            placeholder="e.g. 3-month course on BPO Customer Care"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 6: Job Availability & Salary Expectations */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleSection(6)}
                  className="w-full p-5 bg-slate-50/80 hover:bg-slate-100/80 border-b border-slate-200 text-left flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#10243a] text-white text-xs font-bold flex items-center justify-center">
                      6
                    </span>
                    <div>
                      <h4 className="font-bold text-base text-[#10243a]">Job Availability &amp; Salary Expectations (কাজের প্রাপ্যতা ও বেতন প্রত্যাশা)</h4>
                      <p className="text-xs text-slate-500">Panthapath, Dhaka location, full-time commitment &amp; joining schedule</p>
                    </div>
                  </div>
                  {openSections[6] ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>

                {openSections[6] && (
                  <div className="p-6 grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Can you commit to Full-Time Office Schedule? <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formState.fullTime}
                        onChange={e => handleInputChange('fullTime', e.target.value)}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83] bg-white"
                      >
                        <option value="">-- নির্বাচন করুন --</option>
                        <option value="Yes">Yes (হ্যাঁ, পূর্ণকালীন অফিস সময় করতে সক্ষম)</option>
                        <option value="Discussable">Discussable (আলোচনা সাপেক্ষে)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Can you work in Panthapath, Dhaka Office? <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formState.officeLocation}
                        onChange={e => handleInputChange('officeLocation', e.target.value)}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83] bg-white"
                      >
                        <option value="">-- নির্বাচন করুন --</option>
                        <option value="Yes">Yes (পান্থপথ অফিসে প্রতিদিন কাজ করতে পারব)</option>
                        <option value="Located Nearby">Live nearby Panthapath / Dhanmondi / Green Road</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Expected Joining Timeframe (কবে যোগদান করতে পারবেন) <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formState.joinTime}
                        onChange={e => handleInputChange('joinTime', e.target.value)}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83] bg-white"
                      >
                        <option value="">-- নির্বাচন করুন --</option>
                        <option value="Immediately">Immediately (অবিলম্বে / ৩ দিনের মধ্যে)</option>
                        <option value="Within 7 days">Within 7 days (৭ দিনের মধ্যে)</option>
                        <option value="Within 15 days">Within 15 days (১৫ দিনের মধ্যে)</option>
                        <option value="Within 1 month">Within 1 month (১ মাসের মধ্যে)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Expected Monthly Salary (মাসিক প্রত্যাশিত বেতন BDT) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formState.salary}
                        onChange={e => handleInputChange('salary', e.target.value)}
                        placeholder="e.g. 18000 or 20000 (আলোচনা সাপেক্ষে)"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 7: CV & Supporting Documents */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleSection(7)}
                  className="w-full p-5 bg-slate-50/80 hover:bg-slate-100/80 border-b border-slate-200 text-left flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#10243a] text-white text-xs font-bold flex items-center justify-center">
                      7
                    </span>
                    <div>
                      <h4 className="font-bold text-base text-[#10243a]">CV &amp; Supporting Documents (সিভি ও সংযুক্তি)</h4>
                      <p className="text-xs text-slate-500">Attach updated resume (PDF, max 10MB) and motivational statement</p>
                    </div>
                  </div>
                  {openSections[7] ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>

                {openSections[7] && (
                  <div className="p-6 space-y-5">
                    {/* CV Upload */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Attach Updated CV / Resume (PDF / DOCX, Max 10MB) <span className="text-red-500">*</span>
                      </label>
                      <div className="border-2 border-dashed border-slate-300 hover:border-teal-400 rounded-xl p-5 text-center transition-colors bg-slate-50/50">
                        {cvFile ? (
                          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-teal-200 max-w-md mx-auto">
                            <div className="flex items-center gap-2.5 text-left truncate">
                              <FileCheck2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                              <div className="truncate">
                                <div className="text-xs font-bold text-slate-900 truncate">{cvFile.fileName}</div>
                                <div className="text-[11px] text-slate-500">{formatBytes(cvFile.sizeBytes)}</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoveCv}
                              className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-1"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div>
                            <Download className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-xs text-slate-600 mb-2">
                              Choose your resume file from computer or device
                            </p>
                            <input
                              ref={cvInputRef}
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={handleCvChange}
                              className="text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#167d83] file:text-white hover:file:bg-[#10666b] cursor-pointer"
                            />
                          </div>
                        )}
                        {cvError && <p className="text-xs text-red-600 mt-2 font-medium">{cvError}</p>}
                      </div>
                    </div>

                    {/* Additional Academic / Training docs */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Certificates or Additional Attachments (Optional)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          ref={docsInputRef}
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={handleDocsChange}
                          className="text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer"
                        />
                      </div>
                      {academicDocs.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {academicDocs.map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                              <span className="truncate">{doc.fileName} ({formatBytes(doc.sizeBytes)})</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveDoc(idx)}
                                className="text-red-500 hover:text-red-700 font-bold ml-2"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {docsError && <p className="text-xs text-red-600 mt-1">{docsError}</p>}
                    </div>

                    {/* Motivation Statement */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Why are you interested in working as Customer Care Executive at E-Lawyers? (কেন আপনি আগ্রহী?) <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={formState.motivation}
                        onChange={e => handleInputChange('motivation', e.target.value)}
                        placeholder="Explain briefly why you are a great fit for this Customer Care Executive position..."
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167d83]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 8: Declaration & Submission */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleSection(8)}
                  className="w-full p-5 bg-slate-50/80 hover:bg-slate-100/80 border-b border-slate-200 text-left flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#10243a] text-white text-xs font-bold flex items-center justify-center">
                      8
                    </span>
                    <div>
                      <h4 className="font-bold text-base text-[#10243a]">Declaration &amp; Submission (ঘোষণা ও আবেদন জমা)</h4>
                      <p className="text-xs text-slate-500">Confirm accuracy of information and generate official preview</p>
                    </div>
                  </div>
                  {openSections[8] ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>

                {openSections[8] && (
                  <div className="p-6 space-y-4">
                    <label className="flex items-start gap-3 text-xs md:text-sm text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formState.declarationAccuracy}
                        onChange={e => handleInputChange('declarationAccuracy', e.target.checked)}
                        className="mt-1 rounded text-[#167d83] focus:ring-[#167d83]"
                      />
                      <span>
                        আমি নিশ্চয়তা দিচ্ছি যে, উপরে বর্ণিত যাবতীয় তথ্য সম্পূর্ণ সত্য ও সঠিক। কোনো অসত্য তথ্য প্রমাণিত হলে আবেদনপত্র বাতিল বলে গণ্য হবে। (I confirm all information provided is accurate and truthful).
                      </span>
                    </label>

                    <label className="flex items-start gap-3 text-xs md:text-sm text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formState.declarationContact}
                        onChange={e => handleInputChange('declarationContact', e.target.checked)}
                        className="mt-1 rounded text-[#167d83] focus:ring-[#167d83]"
                      />
                      <span>
                        ই-লয়ার্স রিক্রুটমেন্ট টিমকে মোবাইল ফোন, হোয়াটসঅ্যাপ বা ইমেইলের মাধ্যমে সাক্ষাৎকার বা স্ক্রিনিং পরীক্ষার জন্য আমার সাথে যোগাযোগের অনুমতি প্রদান করছি। (I agree to be contacted for interview &amp; screening).
                      </span>
                    </label>
                  </div>
                )}

                {/* Inline Error Summary & Always-Visible Action Bar */}
                <div className="p-6 bg-slate-50/60 border-t border-slate-200 space-y-4">
                  {errorSummary && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <h5 className="font-bold text-xs text-red-800">{errorSummary}</h5>
                          {missingFieldsList.length > 0 && (
                            <p className="text-xs text-red-700">
                              <strong>Missing:</strong> {missingFieldsList.join(' · ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                      Form Completion: <strong className="text-[#10243a]">{formProgress}%</strong>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleGeneratePreview}
                        className="px-6 py-3 bg-[#10243a] hover:bg-[#193650] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                      >
                        <FileCheck2 className="w-4 h-4 text-[#ddc38f]" />
                        <span>Preview Application (আবেদন পর্যালোচনা)</span>
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmittingApplication}
                        className="px-7 py-3 bg-[#167d83] hover:bg-[#10666b] text-white font-extrabold text-sm rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        {isSubmittingApplication ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Submitting to HR Desk...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 text-emerald-300" />
                            <span>Submit Application to HR (জমা দিন)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {/* Application Preview Card (Visible when preview generated or submitted) */}
            {isPreviewVisible && (
              <div ref={previewCardRef} className="bg-white rounded-2xl border-2 border-[#167d83] overflow-hidden shadow-xl animate-fade-in mt-8">
                {/* Navy & Gold Preview Header */}
                <div className="bg-[#10243a] p-6 text-white border-b-4 border-[#c7a76b]">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-[11px] font-bold tracking-widest text-[#ddc38f] uppercase">
                        Official Application Record
                      </span>
                      <h3 className="text-xl md:text-2xl font-black text-white mt-0.5">
                        Customer Care Executive (Female) Application
                      </h3>
                      <p className="text-xs text-slate-300 mt-1">
                        Ref ID: <span className="font-mono text-[#ddc38f] font-bold">{applicationRefId}</span> · Generated: {generatedAtLabel}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadJson}
                        className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition-all flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-[#ddc38f]" />
                        <span>Download JSON</span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePrintAndSavePdf}
                        className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition-all flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Print / Save PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleEditApplication}
                        className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-[#10243a] rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <span>Edit Form</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Preview Table Content */}
                <div className="p-6 overflow-x-auto">
                  <table className="w-full text-left text-xs md:text-sm border-collapse">
                    <tbody>
                      {previewRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-[#fbfcfd]' : 'bg-white'}`}
                        >
                          <td className="py-2.5 px-4 font-bold text-slate-700 w-1/3 align-top border-r border-slate-100">
                            {row.keyLabel}
                          </td>
                          <td className="py-2.5 px-4 text-slate-900 leading-relaxed align-top">
                            {row.valueText || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Final Submission Bar */}
                {!isSubmittedToHr && (
                  <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-xs text-slate-600">
                      Everything looks good? Submit your application directly to E-Lawyers HR desk.
                    </p>
                    <button
                      type="button"
                      disabled={isSubmittingApplication}
                      onClick={() => handleSubmitApplicationAndNotifyHr()}
                      className="px-7 py-3 bg-gradient-to-r from-[#167d83] to-[#10666b] text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 hover:shadow-lg disabled:opacity-50"
                    >
                      {isSubmittingApplication ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 text-emerald-300" />
                          <span>Confirm &amp; Submit Application</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Post-submission Success Receipt Card */}
            {isSubmittedToHr && submissionReceipt && (
              <div ref={resultCardRef} className="bg-white rounded-2xl border-2 border-emerald-500 overflow-hidden shadow-xl animate-fade-in mt-8">
                <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-6 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-7 h-7 text-emerald-300" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-widest text-emerald-200 font-bold">
                        Application Received Successfully
                      </div>
                      <h3 className="text-2xl font-extrabold text-white">
                        ধন্যবাদ, {submissionReceipt.candidateName}!
                      </h3>
                      <p className="text-xs text-emerald-100 mt-0.5">
                        Your application for Customer Care Executive (Female) has been recorded.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-emerald-800 font-medium">Your Application Reference ID:</span>
                      <div className="text-xl font-mono font-extrabold text-[#10243a]">
                        {submissionReceipt.referenceId}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyRefId}
                      className="px-4 py-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      {copiedRefId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedRefId ? 'Copied!' : 'Copy Reference ID'}</span>
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block">Candidate Email</span>
                      <strong className="text-slate-900">{submissionReceipt.candidateEmail}</strong>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block">HR Recruitment Desk Notified</span>
                      <strong className="text-slate-900">{submissionReceipt.hrEmails.join(', ')}</strong>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block">Dispatch Channel</span>
                      <strong className="text-emerald-700">{submissionReceipt.emailTransport}</strong>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block">Submitted At</span>
                      <strong className="text-slate-900">{submissionReceipt.submittedAt}</strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={handlePrintAndSavePdf}
                      className="px-5 py-2.5 bg-[#10243a] text-white rounded-xl text-xs font-bold hover:bg-[#193650] transition-colors flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4 text-[#ddc38f]" />
                      <span>Download / Print Submission Receipt</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadJson}
                      className="px-5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download JSON Record</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Clear Form Confirmation Modal */}
        {confirmClearOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-up">
              <div className="flex items-center gap-3 text-red-600 mb-3">
                <AlertCircle className="w-6 h-6" />
                <h4 className="font-bold text-lg text-slate-900">Clear All Form Data?</h4>
              </div>
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed mb-6">
                Are you sure you want to erase all entries in this application form? Any unsaved changes will be removed from your browser cache.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmClearOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClearForm}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  Yes, Clear Form
                </button>
              </div>
            </div>
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
export default CareerCustomerCarePage;
