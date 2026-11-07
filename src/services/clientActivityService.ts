export type ClientActivityType = 
  | 'document_upload' 
  | 'task_completion' 
  | 'service_request' 
  | 'compliance_update';

export type ActivityStatus = 'completed' | 'in_review' | 'action_required' | 'verified';

export interface ClientActivity {
  id: string;
  type: ClientActivityType;
  title: string;
  description: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  timestamp: string; // ISO string
  status: ActivityStatus;
  practiceArea: string;
  referenceId: string;
  fileInfo?: {
    fileName: string;
    fileSize: string;
    fileType: 'pdf' | 'docx' | 'xlsx' | 'cert' | 'zip';
  };
  sourceChannel: string;
  notes?: string;
  docketUrl?: string;
}

const STORAGE_KEY = 'elawyers_client_activities';
const EVENT_NAME = 'elawyers_client_activity_updated';

export const INITIAL_CLIENT_ACTIVITIES: ClientActivity[] = [
  {
    id: 'act-2026-9041',
    type: 'document_upload',
    title: 'Uploaded Audited Balance Sheet & P&L (AY 2026-27)',
    description: 'Audited statutory financial accounts certified by ICAB Chartered Accountant uploaded for corporate tax return submission.',
    clientName: 'Tanvir Ahmed',
    clientCompany: 'Apex Footwear Ltd',
    clientEmail: 't.ahmed@apexfootwear.com',
    timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(), // 14 mins ago
    status: 'verified',
    practiceArea: 'Corporate Tax & NBR',
    referenceId: 'DOC-2026-9041',
    fileInfo: {
      fileName: 'Apex_Audited_Financials_2026.pdf',
      fileSize: '3.4 MB',
      fileType: 'pdf'
    },
    sourceChannel: 'Client Portal (Web SSL)',
    notes: 'Uploaded with ICAB digital verification code. Ready for Section 73 assessment attachment.'
  },
  {
    id: 'act-2026-8974',
    type: 'service_request',
    title: 'Requested High Court Division Writ Petition Advisory',
    description: 'New service request for drafting writ defense against NBR customs provisional valuation order under Section 112.',
    clientName: 'Barrister Rafiqul Karim',
    clientCompany: 'Summit Communications Ltd',
    clientEmail: 'r.karim@summit-group.com',
    timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(), // 48 mins ago
    status: 'action_required',
    practiceArea: 'Litigation & Supreme Court',
    referenceId: 'SRV-2026-8974',
    sourceChannel: 'Client Consultation Scheduler',
    notes: 'Urgent notice period: 7 calendar days before High Court motion list cutoff.'
  },
  {
    id: 'act-2026-8912',
    type: 'task_completion',
    title: 'Completed Income Computation Sheet & TDS Reconciliation',
    description: 'Client confirmed reconciliation of 14 withholding tax certificates against NBR e-TIN verification portal.',
    clientName: 'Mahmudul Hossain',
    clientCompany: 'Navana Group of Industries',
    clientEmail: 'm.hossain@navana.com',
    timestamp: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(), // 2.5 hrs ago
    status: 'completed',
    practiceArea: 'Withholding Tax & TDS',
    referenceId: 'TSK-2026-8912',
    sourceChannel: 'Compliance Checklist Task Flow',
    notes: 'Matched with NBR Withholding Tax Rules (Section 177). TDS credit of BDT 1,250,000 confirmed.'
  },
  {
    id: 'act-2026-8855',
    type: 'document_upload',
    title: 'Uploaded Monthly VAT Return Form (Mushak 9.1)',
    description: 'Draft sub-annexures for input tax rebate adjustments (Mushak 4.3) uploaded for chamber legal sign-off.',
    clientName: 'Dr. Sabrina Rahman',
    clientCompany: 'Square Pharmaceuticals Retainer',
    clientEmail: 's.rahman@squarepharma.com.bd',
    timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), // 5 hrs ago
    status: 'in_review',
    practiceArea: 'VAT & Customs',
    referenceId: 'DOC-2026-8855',
    fileInfo: {
      fileName: 'Square_Mushak_9_1_Rebates_Oct2026.xlsx',
      fileSize: '1.2 MB',
      fileType: 'xlsx'
    },
    sourceChannel: 'Client Portal (Web SSL)',
    notes: 'Input VAT credits of BDT 485,200 pending reconciliation with Customs ASYCUDA portal.'
  },
  {
    id: 'act-2026-8790',
    type: 'service_request',
    title: 'Initiated RJSC Annual Corporate Filing Retainer',
    description: 'Requested full secretarial representation for Form XII (Directors), Form X, and Schedule X annual returns.',
    clientName: 'Adnan Mansur',
    clientCompany: 'Grameen Telecom Advisory',
    clientEmail: 'a.mansur@grameen.com',
    timestamp: new Date(Date.now() - 9 * 3600 * 1000).toISOString(), // 9 hrs ago
    status: 'in_review',
    practiceArea: 'Corporate Law & RJSC',
    referenceId: 'SRV-2026-8790',
    sourceChannel: 'Client Consultation Scheduler',
    notes: 'AGM held on Oct 5. Statutory 30-day submission deadline approaching.'
  },
  {
    id: 'act-2026-8742',
    type: 'task_completion',
    title: 'Completed Corporate Governance Checklist & Board Resolution',
    description: 'Signed board resolution endorsing amended memorandum articles for overseas debt financing compliance.',
    clientName: 'Kamrul Zaman',
    clientCompany: 'Beximco Petroleum & Energy',
    clientEmail: 'k.zaman@beximco.net',
    timestamp: new Date(Date.now() - 22 * 3600 * 1000).toISOString(), // 22 hrs ago
    status: 'verified',
    practiceArea: 'Corporate Law & Governance',
    referenceId: 'TSK-2026-8742',
    sourceChannel: 'Client Portal Signature Gateway',
    notes: 'Board resolution certified by Company Secretary and Managing Director.'
  },
  {
    id: 'act-2026-8650',
    type: 'compliance_update',
    title: 'Updated Beneficial Ownership Register (Section 114)',
    description: 'Submitted updated declaration of beneficial controllers in compliance with Bangladesh Bank AML/CFT guidelines.',
    clientName: 'Shazia Haque',
    clientCompany: 'IDLC Finance Institutional Partner',
    clientEmail: 's.haque@idlc.com',
    timestamp: new Date(Date.now() - 31 * 3600 * 1000).toISOString(), // Yesterday
    status: 'completed',
    practiceArea: 'Banking & Financial Regulations',
    referenceId: 'CMP-2026-8650',
    sourceChannel: 'Client Portal Compliance Vault',
    notes: 'Verified against Bangladesh Bank BFIU Circular requirements.'
  }
];

export function fetchClientActivities(): ClientActivity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CLIENT_ACTIVITIES));
      return INITIAL_CLIENT_ACTIVITIES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CLIENT_ACTIVITIES));
      return INITIAL_CLIENT_ACTIVITIES;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load client activities from storage:', err);
    return INITIAL_CLIENT_ACTIVITIES;
  }
}

export function addClientActivity(activity: Omit<ClientActivity, 'id' | 'timestamp'> & { timestamp?: string }): ClientActivity {
  const current = fetchClientActivities();
  const newActivity: ClientActivity = {
    ...activity,
    id: `act-${Date.now().toString().slice(-6)}`,
    timestamp: activity.timestamp || new Date().toISOString()
  };

  const updated = [newActivity, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: newActivity }));
  return newActivity;
}

export function updateActivityStatus(activityId: string, newStatus: ActivityStatus, updatedNotes?: string): ClientActivity[] {
  const current = fetchClientActivities();
  const updated = current.map(item => {
    if (item.id === activityId) {
      return {
        ...item,
        status: newStatus,
        notes: updatedNotes !== undefined ? updatedNotes : item.notes
      };
    }
    return item;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { id: activityId, status: newStatus } }));
  return updated;
}

export function deleteClientActivity(activityId: string): ClientActivity[] {
  const current = fetchClientActivities();
  const updated = current.filter(item => item.id !== activityId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { id: activityId, deleted: true } }));
  return updated;
}

export function resetClientActivities(): ClientActivity[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CLIENT_ACTIVITIES));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
  return INITIAL_CLIENT_ACTIVITIES;
}

// Format relative time helper
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 172800) return 'Yesterday';
  
  const days = Math.floor(diffInSeconds / 86400);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

// Generate CSV export
export function exportActivitiesToCSV(activities: ClientActivity[]): void {
  const headers = ['Activity ID', 'Type', 'Title', 'Client Name', 'Company', 'Email', 'Practice Area', 'Status', 'Date', 'Reference ID', 'Channel'];
  const rows = activities.map(a => [
    `"${a.id}"`,
    `"${a.type}"`,
    `"${a.title.replace(/"/g, '""')}"`,
    `"${a.clientName.replace(/"/g, '""')}"`,
    `"${a.clientCompany.replace(/"/g, '""')}"`,
    `"${a.clientEmail}"`,
    `"${a.practiceArea}"`,
    `"${a.status}"`,
    `"${new Date(a.timestamp).toLocaleString()}"`,
    `"${a.referenceId}"`,
    `"${a.sourceChannel}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Client_Activity_Log_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
