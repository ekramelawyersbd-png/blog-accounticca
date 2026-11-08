import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Send,
  LogOut,
  ShieldCheck,
  Sparkles,
  FileText,
  FolderOpen,
  Calendar as CalendarIcon,
  Mail,
  CheckSquare,
  MessageSquare,
  Presentation,
  Table
} from 'lucide-react';
import {
  getAccessToken,
  getConnectedWorkspaceEmail,
  signInWithWorkspaceGoogle,
  logoutWorkspace,
  DEFAULT_WORKSPACE_EMAIL
} from '../../services/workspaceAuth';
import {
  workspaceDriveApi,
  workspaceSheetsApi,
  workspaceGmailApi,
  workspaceCalendarApi,
  workspaceDocsApi,
  workspaceSlidesApi,
  workspaceTasksApi,
  workspaceChatApi,
  DriveFile,
  CalendarEvent,
  GoogleTask,
  ChatSpace,
  ChatMessage,
  GmailMessageSummary
} from '../../services/workspaceService';
import { GoogleApiActivationNotice } from './GoogleApiActivationNotice';

export type WorkspaceIntegrationId =
  | 'drive'
  | 'sheets'
  | 'gmail'
  | 'calendar'
  | 'docs'
  | 'slides'
  | 'tasks'
  | 'chat';

interface IntegrationCardConfig {
  id: WorkspaceIntegrationId;
  name: string;
  description: string;
  apiName: string;
  renderIcon: () => React.ReactNode;
}

const ENABLED_INTEGRATIONS: IntegrationCardConfig[] = [
  {
    id: 'drive',
    name: 'Google Drive',
    description: 'Access Drive files and folders',
    apiName: 'Google Drive API',
    renderIcon: () => (
      <svg className="w-9 h-9" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
        <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
        <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
        <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" />
        <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
        <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
        <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
      </svg>
    )
  },
  {
    id: 'sheets',
    name: 'Google Sheets',
    description: 'Transform your spreadsheet data',
    apiName: 'Google Sheets API',
    renderIcon: () => (
      <svg className="w-9 h-9" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="10" width="36" height="28" rx="4" fill="#0F9D58" />
        <rect x="11" y="15" width="14" height="18" rx="1.5" fill="#A8DAB5" />
        <path d="M29 24H37M33 20V28M26 24H37" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Manage emails with code',
    apiName: 'Gmail API',
    renderIcon: () => (
      <svg className="w-9 h-9" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z" />
        <path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z" />
        <polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17" />
        <path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z" />
        <path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0 C43.076,8,45,9.924,45,12.298z" />
      </svg>
    )
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    description: 'Create & manage events',
    apiName: 'Google Calendar API',
    renderIcon: () => (
      <svg className="w-9 h-9" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="32" height="32" rx="6" fill="#4285F4" />
        <path d="M32 40L40 32H32V40Z" fill="#1967D2" />
        <text x="24" y="30" textAnchor="middle" fill="#FFFFFF" fontSize="16" fontWeight="bold" fontFamily="sans-serif">
          31
        </text>
      </svg>
    )
  },
  {
    id: 'docs',
    name: 'Google Docs',
    description: 'Build custom Google Docs workflows',
    apiName: 'Google Docs API',
    renderIcon: () => (
      <svg className="w-9 h-9" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path fill="#4285F4" d="M37,45H11c-1.657,0-3-1.343-3-3V6c0-1.657,1.343-3,3-3h19l10,10v29C40,43.657,38.657,45,37,45z" />
        <path fill="#A1C2FA" d="M40 13L30 13 30 3z" />
        <path fill="#FFFFFF" d="M15 23H33V25H15zM15 28H33V30H15zM15 33H25V35H15z" />
      </svg>
    )
  },
  {
    id: 'slides',
    name: 'Google Slides',
    description: 'Integrate your slide decks',
    apiName: 'Google Slides API',
    renderIcon: () => (
      <svg className="w-9 h-9" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="10" width="36" height="28" rx="4" fill="#F4B400" />
        <rect x="13" y="16" width="22" height="16" rx="2" fill="#FFFFFF" />
        <rect x="16" y="19" width="16" height="10" rx="1" fill="#F4B400" />
      </svg>
    )
  },
  {
    id: 'tasks',
    name: 'Google Tasks',
    description: 'Create and manage tasks',
    apiName: 'Google Tasks API',
    renderIcon: () => (
      <svg className="w-9 h-9" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="18" fill="#4285F4" />
        <path d="M16 24.5L21.5 30L33 18.5" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    )
  },
  {
    id: 'chat',
    name: 'Google Chat',
    description: 'Read and summarize Chat spaces',
    apiName: 'Google Chat API',
    renderIcon: () => (
      <svg className="w-9 h-9" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path
          fill="#00AC47"
          d="M24 6C13.5 6 5 13.4 5 22.5c0 4.2 1.8 8 4.8 10.9L8 42l9.2-4.1c2.1.7 4.4 1.1 6.8 1.1 10.5 0 19-7.4 19-16.5S34.5 6 24 6z"
        />
        <path d="M15 21h18M15 26h12" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  }
];

interface PendingConfirmation {
  title: string;
  description: string;
  confirmLabel: string;
  isDestructive?: boolean;
  onConfirm: () => Promise<void>;
}

export const GoogleWorkspaceIntegrationsPanel: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<WorkspaceIntegrationId>('drive');
  const [accessToken, setAccessTokenState] = useState<string | null>(() => getAccessToken());
  const [connectedEmail, setConnectedEmail] = useState<string>(() => getConnectedWorkspaceEmail());
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Shared loading / feedback / API activation notice states
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [disabledApiError, setDisabledApiError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // 1. Google Drive state
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveSearch, setDriveSearch] = useState('');
  const [newDriveFileName, setNewDriveFileName] = useState('AY_2026_27_Salary_TDS_Summary.txt');
  const [newDriveFileContent, setNewDriveFileContent] = useState(
    'Bangladesh Income Tax & Salary TDS Summary (AY 2026–2027)\nSection 86 Monthly TDS | General Threshold: Tk. 4,00,000 | Salary Exemption Ceiling: min(1/3 Gross, Tk. 5,00,000)'
  );

  // 2. Google Sheets state
  const [newSheetTitle, setNewSheetTitle] = useState('AY 2026-27 Monthly Salary TDS Ledger');
  const [activeSpreadsheetId, setActiveSpreadsheetId] = useState('');
  const [sheetRange, setSheetRange] = useState('Sheet1!A1:E10');
  const [sheetValues, setSheetValues] = useState<any[][]>([]);
  const [appendEmployeeName, setAppendEmployeeName] = useState('Md. Rahim Uddin');
  const [appendGrossSalary, setAppendGrossSalary] = useState('1200000');
  const [appendTaxableIncome, setAppendTaxableIncome] = useState('800000');
  const [appendMonthlyTds, setAppendMonthlyTds] = useState('2083.33');

  // 3. Gmail state
  const [gmailMessages, setGmailMessages] = useState<GmailMessageSummary[]>([]);
  const [emailTo, setEmailTo] = useState(DEFAULT_WORKSPACE_EMAIL);
  const [emailSubject, setEmailSubject] = useState('AY 2026–27 Monthly Salary TDS Computation & Section 78 Rebate Notice');
  const [emailBody, setEmailBody] = useState(
    'Dear Taxpayer,\n\nPlease find attached your AY 2026–2027 Salary TDS (Section 86) and Investment Rebate (Section 78) estimate.\n\nBest regards,\nAccounticca × E-Lawyers Compliance Desk'
  );

  // 4. Google Calendar state
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [eventSummary, setEventSummary] = useState('Monthly Salary TDS Withholding & Challan Review (Sec 86)');
  const [eventDate, setEventDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split('T')[0];
  });

  // 5. Google Docs state
  const [newDocTitle, setNewDocTitle] = useState('AY 2026–27 Salary TDS Certificate & Rebate Memo');
  const [activeDocId, setActiveDocId] = useState('');
  const [docInsertText, setDocInsertText] = useState(
    'SALARY TDS CERTIFICATE (SECTION 86, INCOME TAX ACT 2023)\nAssessment Year: 2026–2027\n1. Tax-Free Threshold: Tk. 4,00,000 (General)\n2. Salary Exemption: min(1/3 of Gross Salary, Tk. 5,00,000)\n3. Tax Rebate: min(3% Taxable Income, 10% Allowable Investment, Tk. 7,50,000)\n'
  );

  // 6. Google Slides state
  const [newSlideTitle, setNewSlideTitle] = useState('Bangladesh Income Tax & Salary TDS 2026–27 Executive Deck');
  const [createdPresentation, setCreatedPresentation] = useState<{ presentationId: string; title: string } | null>(null);

  // 7. Google Tasks state
  const [tasksList, setTasksList] = useState<GoogleTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('Verify employee Section 78 investment declarations before May payroll');
  const [newTaskNotes, setNewTaskNotes] = useState('Check DPS (cap Tk. 1.2L), Sanchayapatra (cap Tk. 5L), and SRO 213/2026 charity receipts.');

  // 8. Google Chat state
  const [chatSpaces, setChatSpaces] = useState<ChatSpace[]>([]);
  const [selectedSpaceName, setSelectedSpaceName] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState(
    'Reminder: AY 2026–27 Monthly Salary TDS schedule updated with Tk. 4,00,000 general threshold and Section 86 average withholding rates.'
  );

  const filteredIntegrations = ENABLED_INTEGRATIONS.filter(
    item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConfig = ENABLED_INTEGRATIONS.find(i => i.id === selectedId) || ENABLED_INTEGRATIONS[0];

  const handleApiError = (err: any) => {
    const msg = err?.message || 'Google Workspace API request failed.';
    if (
      msg.includes('has not been used in project') ||
      msg.includes('is disabled') ||
      msg.includes('accessNotConfigured') ||
      msg.includes('403')
    ) {
      setDisabledApiError(msg);
    }
    setErrorMessage(msg);
  };

  const clearFeedback = () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setDisabledApiError(null);
  };

  const handleGoogleConnect = async () => {
    clearFeedback();
    setIsSigningIn(true);
    try {
      const result = await signInWithWorkspaceGoogle(DEFAULT_WORKSPACE_EMAIL);
      setAccessTokenState(result.accessToken);
      setConnectedEmail(result.user.email || DEFAULT_WORKSPACE_EMAIL);
      setStatusMessage(`Connected to Google Workspace as ${result.user.email || DEFAULT_WORKSPACE_EMAIL}`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Sign-in could not be completed. Please allow popups and try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleWorkspaceSignOut = async () => {
    clearFeedback();
    await logoutWorkspace();
    setAccessTokenState(null);
    setStatusMessage('Disconnected from Google Workspace session.');
  };

  // Load active integration data when token and selectedId are available
  const loadIntegrationData = useCallback(async () => {
    const token = getAccessToken();
    setAccessTokenState(token);
    if (!token) return;

    clearFeedback();
    setIsLoadingData(true);
    try {
      if (selectedId === 'drive') {
        const q = driveSearch.trim()
          ? `name contains '${driveSearch.trim().replace(/'/g, "\\'")}' and trashed = false`
          : 'trashed = false';
        const files = await workspaceDriveApi.listFiles(12, q);
        setDriveFiles(files);
      } else if (selectedId === 'gmail') {
        const msgs = await workspaceGmailApi.listMessages(8);
        setGmailMessages(msgs);
      } else if (selectedId === 'calendar') {
        const events = await workspaceCalendarApi.listEvents(10);
        setCalendarEvents(events);
      } else if (selectedId === 'tasks') {
        const items = await workspaceTasksApi.listTasks();
        setTasksList(items);
      } else if (selectedId === 'chat') {
        const spaces = await workspaceChatApi.listSpaces();
        setChatSpaces(spaces);
        if (spaces.length > 0 && !selectedSpaceName) {
          setSelectedSpaceName(spaces[0].name);
        }
      }
    } catch (err: any) {
      handleApiError(err);
    } finally {
      setIsLoadingData(false);
    }
  }, [selectedId, driveSearch, selectedSpaceName]);

  useEffect(() => {
    if (accessToken) {
      loadIntegrationData();
    }
  }, [accessToken, selectedId, loadIntegrationData]);

  // Execute confirmed mutation/deletion
  const handleExecuteConfirmedAction = async () => {
    if (!pendingConfirmation) return;
    setIsConfirming(true);
    clearFeedback();
    try {
      await pendingConfirmation.onConfirm();
      setPendingConfirmation(null);
    } catch (err: any) {
      handleApiError(err);
      setPendingConfirmation(null);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Main Integrations Directory Card (Matches Screenshot Layout) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Integrations</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Connect and manage your enabled Google Workspace apps directly from `/workspace` with user permission.
            </p>
          </div>

          {/* Google Workspace OAuth Connection Status & Official Button */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-300/80 px-4 py-2.5 rounded-2xl shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
              <div className="text-xs">
                <span className="font-extrabold text-emerald-950 block">
                  {connectedEmail || DEFAULT_WORKSPACE_EMAIL}
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Permanently Connected Google Workspace</span>
                </span>
              </div>
            </div>
            {!accessToken && (
              <button
                type="button"
                onClick={handleGoogleConnect}
                disabled={isSigningIn}
                className="gsi-material-button inline-flex items-center gap-3 px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-300 shadow-xs text-sm font-semibold text-slate-800 transition-all cursor-pointer disabled:opacity-60"
              >
                <div className="gsi-material-button-icon w-5 h-5 shrink-0">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-full h-full block">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {isSigningIn ? 'Re-authenticating...' : 'Re-authenticate Workspace'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Search integrations bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search integrations"
            aria-label="Search integrations"
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Enabled integrations section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-slate-600">Enabled integrations</h3>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              {filteredIntegrations.length} Active
            </span>
          </div>

          {/* 2-Column Grid matching the user's screenshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredIntegrations.map(integration => {
              const isSelected = integration.id === selectedId;
              return (
                <button
                  key={integration.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(integration.id);
                    clearFeedback();
                  }}
                  className={`text-left p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                    isSelected
                      ? 'bg-slate-100/90 border-slate-300 shadow-xs ring-2 ring-blue-500/20'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200/90'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="w-11 h-11 flex items-center justify-center rounded-xl">
                      {integration.renderIcon()}
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      Enabled
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-base font-semibold text-slate-900">{integration.name}</h4>
                    <p className="text-sm text-slate-500 leading-snug">{integration.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {statusMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && !disabledApiError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {disabledApiError && (
        <GoogleApiActivationNotice
          apiName={selectedConfig.apiName}
          errorMessage={disabledApiError}
          onRetry={loadIntegrationData}
          isLoading={isLoadingData}
        />
      )}

      {/* Interactive Live Console for Selected Integration */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200">
              {selectedConfig.renderIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">{selectedConfig.name} Workspace Console</h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Enabled
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{selectedConfig.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {accessToken ? (
              <button
                type="button"
                onClick={loadIntegrationData}
                disabled={isLoadingData}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
                <span>Refresh {selectedConfig.name}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGoogleConnect}
                disabled={isSigningIn}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Sign in with Google to Authorize Live Data</span>
              </button>
            )}
          </div>
        </div>

        {/* 1. GOOGLE DRIVE WORKSPACE */}
        {selectedId === 'drive' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={driveSearch}
                  onChange={e => setDriveSearch(e.target.value)}
                  placeholder="Filter Drive files by name..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
                <button
                  type="button"
                  onClick={loadIntegrationData}
                  disabled={!accessToken || isLoadingData}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  Search Drive
                </button>
              </div>

              {!accessToken ? (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <FolderOpen className="w-8 h-8 text-blue-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-900">Sign in with Google to browse your Drive files</h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    With your permission, this workspace can list, search, create, and organize compliance documents in Google Drive.
                  </p>
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                  {isLoadingData ? 'Loading Google Drive files...' : 'No matching Drive files found.'}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {driveFiles.map(file => (
                    <div key={file.id} className="p-3.5 bg-white hover:bg-slate-50 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{file.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{file.mimeType}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setPendingConfirmation({
                              title: `Delete "${file.name}" from Google Drive?`,
                              description: `Are you sure you want to permanently delete "${file.name}" from your Google Drive? This action cannot be undone.`,
                              confirmLabel: 'Delete File',
                              isDestructive: true,
                              onConfirm: async () => {
                                await workspaceDriveApi.deleteFile(file.id);
                                setDriveFiles(prev => prev.filter(f => f.id !== file.id));
                                setStatusMessage(`Deleted "${file.name}" from Google Drive.`);
                              }
                            })
                          }
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete Drive file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Create Compliance File in Drive
              </h4>
              <input
                type="text"
                value={newDriveFileName}
                onChange={e => setNewDriveFileName(e.target.value)}
                placeholder="File name"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900"
              />
              <textarea
                rows={4}
                value={newDriveFileContent}
                onChange={e => setNewDriveFileContent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-800"
              />
              <button
                type="button"
                disabled={!accessToken}
                onClick={async () => {
                  clearFeedback();
                  try {
                    const created = await workspaceDriveApi.createFile(newDriveFileName, newDriveFileContent);
                    setDriveFiles(prev => [created, ...prev]);
                    setStatusMessage(`Created "${created.name}" in Google Drive.`);
                  } catch (err: any) {
                    handleApiError(err);
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Save to Google Drive</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. GOOGLE SHEETS WORKSPACE */}
        {selectedId === 'sheets' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Table className="w-4 h-4 text-emerald-600" />
                <span>Create or Load Compliance Spreadsheet</span>
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSheetTitle}
                  onChange={e => setNewSheetTitle(e.target.value)}
                  placeholder="New Spreadsheet Title"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900"
                />
                <button
                  type="button"
                  disabled={!accessToken}
                  onClick={async () => {
                    clearFeedback();
                    try {
                      const created = await workspaceSheetsApi.createSpreadsheet(newSheetTitle);
                      setActiveSpreadsheetId(created.spreadsheetId);
                      setStatusMessage(`Created spreadsheet "${created.properties.title}" (ID: ${created.spreadsheetId}).`);
                    } catch (err: any) {
                      handleApiError(err);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  Create Sheet
                </button>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700">Spreadsheet ID &amp; Range</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={activeSpreadsheetId}
                    onChange={e => setActiveSpreadsheetId(e.target.value)}
                    placeholder="Paste Spreadsheet ID"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-mono"
                  />
                  <input
                    type="text"
                    value={sheetRange}
                    onChange={e => setSheetRange(e.target.value)}
                    placeholder="Sheet1!A1:E10"
                    className="w-36 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-mono"
                  />
                  <button
                    type="button"
                    disabled={!accessToken || !activeSpreadsheetId.trim()}
                    onClick={async () => {
                      clearFeedback();
                      try {
                        const rows = await workspaceSheetsApi.getValues(activeSpreadsheetId.trim(), sheetRange);
                        setSheetValues(rows);
                        setStatusMessage(`Loaded ${rows.length} row(s) from Google Sheets.`);
                      } catch (err: any) {
                        handleApiError(err);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    Read Data
                  </button>
                </div>
              </div>

              {sheetValues.length > 0 && (
                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white p-3">
                  <table className="w-full text-left text-xs border-collapse">
                    <tbody>
                      {sheetValues.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-slate-100 last:border-none">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="py-1.5 px-2 font-mono text-slate-800">
                              {String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Append AY 2026–27 Salary TDS Row to Sheet
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Employee Name</label>
                  <input
                    type="text"
                    value={appendEmployeeName}
                    onChange={e => setAppendEmployeeName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Annual Gross Salary (BDT)</label>
                  <input
                    type="text"
                    value={appendGrossSalary}
                    onChange={e => setAppendGrossSalary(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Taxable Salary (BDT)</label>
                  <input
                    type="text"
                    value={appendTaxableIncome}
                    onChange={e => setAppendTaxableIncome(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Monthly TDS u/s 86 (BDT)</label>
                  <input
                    type="text"
                    value={appendMonthlyTds}
                    onChange={e => setAppendMonthlyTds(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900"
                  />
                </div>
              </div>
              <button
                type="button"
                disabled={!accessToken || !activeSpreadsheetId.trim()}
                onClick={() =>
                  setPendingConfirmation({
                    title: 'Append Payroll TDS Row to Google Sheet?',
                    description: `This will append [${appendEmployeeName}, Gross: Tk. ${appendGrossSalary}, Taxable: Tk. ${appendTaxableIncome}, Monthly TDS: Tk. ${appendMonthlyTds}] to range ${sheetRange}.`,
                    confirmLabel: 'Confirm & Append Row',
                    onConfirm: async () => {
                      await workspaceSheetsApi.appendValues(activeSpreadsheetId.trim(), sheetRange, [
                        [appendEmployeeName, appendGrossSalary, appendTaxableIncome, appendMonthlyTds, new Date().toISOString()]
                      ]);
                      setStatusMessage('Appended Salary TDS row to Google Sheets.');
                    }
                  })
                }
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Append Row to Spreadsheet
              </button>
            </div>
          </div>
        )}

        {/* 3. GMAIL WORKSPACE */}
        {selectedId === 'gmail' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-rose-600" />
                <span>Recent Gmail Messages</span>
              </h4>
              {!accessToken ? (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  Sign in with Google above to view and manage your recent emails with permission.
                </div>
              ) : gmailMessages.length === 0 ? (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                  {isLoadingData ? 'Loading recent Gmail threads...' : 'No recent messages loaded.'}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {gmailMessages.map(msg => (
                    <div key={msg.id} className="p-3.5 bg-white hover:bg-slate-50 space-y-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{msg.subject || '(No Subject)'}</p>
                      <p className="text-[11px] text-slate-500 truncate">{msg.from}</p>
                      {msg.snippet && <p className="text-xs text-slate-600 line-clamp-2">{msg.snippet}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Compose &amp; Send Compliance Email via Gmail
              </h4>
              <input
                type="email"
                value={emailTo}
                onChange={e => setEmailTo(e.target.value)}
                placeholder="Recipient email"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900"
              />
              <input
                type="text"
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
                placeholder="Subject"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900"
              />
              <textarea
                rows={4}
                value={emailBody}
                onChange={e => setEmailBody(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800"
              />
              <button
                type="button"
                disabled={!accessToken || !emailTo.trim()}
                onClick={() =>
                  setPendingConfirmation({
                    title: `Send Email to ${emailTo}?`,
                    description: `You are about to send an email with subject "${emailSubject}" to ${emailTo} on behalf of your connected Gmail account.`,
                    confirmLabel: 'Confirm & Send Email',
                    onConfirm: async () => {
                      await workspaceGmailApi.sendEmail(emailTo.trim(), emailSubject, emailBody);
                      setStatusMessage(`Email sent to ${emailTo} via Gmail API.`);
                    }
                  })
                }
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Email with Confirmation</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. GOOGLE CALENDAR WORKSPACE */}
        {selectedId === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                <span>Upcoming Google Calendar Events</span>
              </h4>
              {!accessToken ? (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  Sign in with Google above to see and update calendar events with your permission.
                </div>
              ) : calendarEvents.length === 0 ? (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                  {isLoadingData ? 'Loading upcoming events...' : 'No upcoming calendar events found.'}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {calendarEvents.map(ev => (
                    <div key={ev.id} className="p-3.5 bg-white hover:bg-slate-50 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{ev.summary}</p>
                        <p className="text-[11px] text-slate-500">
                          {ev.start?.dateTime || ev.start?.date || 'Scheduled'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setPendingConfirmation({
                            title: `Delete Calendar Event "${ev.summary}"?`,
                            description: `Are you sure you want to remove "${ev.summary}" from your Google Calendar?`,
                            confirmLabel: 'Delete Event',
                            isDestructive: true,
                            onConfirm: async () => {
                              await workspaceCalendarApi.deleteEvent(ev.id);
                              setCalendarEvents(prev => prev.filter(item => item.id !== ev.id));
                              setStatusMessage(`Removed "${ev.summary}" from Google Calendar.`);
                            }
                          })
                        }
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Schedule Statutory Deadline / Consultation Event
              </h4>
              <input
                type="text"
                value={eventSummary}
                onChange={e => setEventSummary(e.target.value)}
                placeholder="Event title"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900"
              />
              <input
                type="date"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900"
              />
              <button
                type="button"
                disabled={!accessToken || !eventSummary.trim()}
                onClick={() =>
                  setPendingConfirmation({
                    title: 'Add Event to Google Calendar?',
                    description: `Schedule "${eventSummary}" on ${eventDate} in your primary Google Calendar?`,
                    confirmLabel: 'Create Event',
                    onConfirm: async () => {
                      const startIso = new Date(`${eventDate}T10:00:00`).toISOString();
                      const endIso = new Date(`${eventDate}T11:00:00`).toISOString();
                      const created = await workspaceCalendarApi.createEvent({
                        summary: eventSummary,
                        description: 'Scheduled via Accounticca × E-Lawyers Compliance Workspace (/workspace)',
                        start: { dateTime: startIso },
                        end: { dateTime: endIso }
                      });
                      setCalendarEvents(prev => [created, ...prev]);
                      setStatusMessage(`Added "${created.summary}" to Google Calendar.`);
                    }
                  })
                }
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Create Calendar Event
              </button>
            </div>
          </div>
        )}

        {/* 5. GOOGLE DOCS WORKSPACE */}
        {selectedId === 'docs' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Create Custom Google Doc</span>
              </h4>
              <input
                type="text"
                value={newDocTitle}
                onChange={e => setNewDocTitle(e.target.value)}
                placeholder="Document Title"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900"
              />
              <button
                type="button"
                disabled={!accessToken || !newDocTitle.trim()}
                onClick={async () => {
                  clearFeedback();
                  try {
                    const doc = await workspaceDocsApi.createDocument(newDocTitle.trim());
                    setActiveDocId(doc.documentId);
                    setStatusMessage(`Created Google Doc "${doc.title}" (ID: ${doc.documentId}).`);
                  } catch (err: any) {
                    handleApiError(err);
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Create New Google Doc
              </button>
              {activeDocId && (
                <a
                  href={`https://docs.google.com/document/d/${activeDocId}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline pt-1"
                >
                  <span>Open Active Google Doc in New Tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Insert Statutory Clauses into Google Doc
              </h4>
              <input
                type="text"
                value={activeDocId}
                onChange={e => setActiveDocId(e.target.value)}
                placeholder="Target Document ID"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900"
              />
              <textarea
                rows={4}
                value={docInsertText}
                onChange={e => setDocInsertText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-800"
              />
              <button
                type="button"
                disabled={!accessToken || !activeDocId.trim()}
                onClick={() =>
                  setPendingConfirmation({
                    title: 'Update Google Doc Content?',
                    description: `Insert the selected statutory clauses into Google Doc (${activeDocId})?`,
                    confirmLabel: 'Confirm & Insert Text',
                    onConfirm: async () => {
                      await workspaceDocsApi.insertText(activeDocId.trim(), docInsertText);
                      setStatusMessage('Inserted statutory text into Google Doc.');
                    }
                  })
                }
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Insert Text into Google Doc
              </button>
            </div>
          </div>
        )}

        {/* 6. GOOGLE SLIDES WORKSPACE */}
        {selectedId === 'slides' && (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Presentation className="w-4 h-4 text-amber-500" />
              <span>Generate Google Slides Presentation Deck</span>
            </h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newSlideTitle}
                onChange={e => setNewSlideTitle(e.target.value)}
                placeholder="Presentation Title"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900"
              />
              <button
                type="button"
                disabled={!accessToken || !newSlideTitle.trim()}
                onClick={async () => {
                  clearFeedback();
                  try {
                    const deck = await workspaceSlidesApi.createPresentation(newSlideTitle.trim());
                    setCreatedPresentation(deck);
                    setStatusMessage(`Created Google Slides deck "${deck.title}".`);
                  } catch (err: any) {
                    handleApiError(err);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black cursor-pointer disabled:opacity-50"
              >
                Create Slide Deck
              </button>
            </div>
            {createdPresentation && (
              <div className="p-4 rounded-xl bg-white border border-amber-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">{createdPresentation.title}</p>
                  <p className="text-[11px] font-mono text-slate-500">ID: {createdPresentation.presentationId}</p>
                </div>
                <a
                  href={`https://docs.google.com/presentation/d/${createdPresentation.presentationId}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold"
                >
                  <span>Open in Google Slides</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* 7. GOOGLE TASKS WORKSPACE */}
        {selectedId === 'tasks' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <span>Active Compliance Tasks</span>
              </h4>
              {!accessToken ? (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  Sign in with Google above to create and manage tasks in Google Tasks.
                </div>
              ) : tasksList.length === 0 ? (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                  {isLoadingData ? 'Loading Google Tasks...' : 'No tasks found in your default list.'}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {tasksList.map(t => (
                    <div key={t.id} className="p-3.5 bg-white hover:bg-slate-50 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={t.status === 'completed'}
                          onChange={() =>
                            setPendingConfirmation({
                              title: 'Update Task Status?',
                              description: `Mark "${t.title}" as ${t.status === 'completed' ? 'needsAction' : 'completed'}?`,
                              confirmLabel: 'Update Task',
                              onConfirm: async () => {
                                const nextStatus = t.status === 'completed' ? 'needsAction' : 'completed';
                                const updated = await workspaceTasksApi.updateTaskStatus(t.id, nextStatus);
                                setTasksList(prev => prev.map(item => (item.id === t.id ? updated : item)));
                                setStatusMessage(`Updated task "${t.title}".`);
                              }
                            })
                          }
                          className="rounded border-slate-300 text-blue-600 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {t.title}
                          </p>
                          {t.notes && <p className="text-[11px] text-slate-500 truncate">{t.notes}</p>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setPendingConfirmation({
                            title: `Delete Task "${t.title}"?`,
                            description: `Are you sure you want to delete "${t.title}" from Google Tasks?`,
                            confirmLabel: 'Delete Task',
                            isDestructive: true,
                            onConfirm: async () => {
                              await workspaceTasksApi.deleteTask(t.id);
                              setTasksList(prev => prev.filter(item => item.id !== t.id));
                              setStatusMessage(`Deleted task "${t.title}".`);
                            }
                          })
                        }
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Create New Compliance Task
              </h4>
              <input
                type="text"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="Task title"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900"
              />
              <textarea
                rows={3}
                value={newTaskNotes}
                onChange={e => setNewTaskNotes(e.target.value)}
                placeholder="Task notes"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800"
              />
              <button
                type="button"
                disabled={!accessToken || !newTaskTitle.trim()}
                onClick={async () => {
                  clearFeedback();
                  try {
                    const created = await workspaceTasksApi.createTask({
                      title: newTaskTitle.trim(),
                      notes: newTaskNotes.trim()
                    });
                    setTasksList(prev => [created, ...prev]);
                    setStatusMessage(`Created task "${created.title}".`);
                  } catch (err: any) {
                    handleApiError(err);
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Add Task to Google Tasks
              </button>
            </div>
          </div>
        )}

        {/* 8. GOOGLE CHAT WORKSPACE */}
        {selectedId === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Google Chat Spaces</span>
              </h4>
              {!accessToken ? (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  Sign in with Google above to read and summarize Google Chat spaces with your permission.
                </div>
              ) : chatSpaces.length === 0 ? (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                  {isLoadingData ? 'Loading Google Chat spaces...' : 'No Google Chat spaces found for this account.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {chatSpaces.map(space => (
                    <button
                      key={space.name}
                      type="button"
                      onClick={async () => {
                        setSelectedSpaceName(space.name);
                        try {
                          const msgs = await workspaceChatApi.listMessages(space.name, 10);
                          setChatMessages(msgs);
                        } catch (err: any) {
                          handleApiError(err);
                        }
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between ${
                        selectedSpaceName === space.name
                          ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-950'
                          : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <span>{space.displayName || space.name}</span>
                      <span className="text-[11px] font-mono text-slate-500">{space.type || 'SPACE'}</span>
                    </button>
                  ))}
                </div>
              )}

              {chatMessages.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Recent Space Messages ({selectedSpaceName})
                  </h5>
                  {chatMessages.map(m => (
                    <div key={m.name} className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                      <span className="font-bold text-slate-900">{m.sender?.displayName || 'Member'}: </span>
                      <span className="text-slate-700">{m.text || '(Attachment)'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Post Compliance Update to Chat Space
              </h4>
              <input
                type="text"
                value={selectedSpaceName}
                onChange={e => setSelectedSpaceName(e.target.value)}
                placeholder="spaces/AAAA..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900"
              />
              <textarea
                rows={3}
                value={newChatMessage}
                onChange={e => setNewChatMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800"
              />
              <button
                type="button"
                disabled={!accessToken || !selectedSpaceName.trim() || !newChatMessage.trim()}
                onClick={() =>
                  setPendingConfirmation({
                    title: `Send Message to ${selectedSpaceName}?`,
                    description: `Post the following message to Google Chat space (${selectedSpaceName}) on your behalf?\n"${newChatMessage}"`,
                    confirmLabel: 'Confirm & Send Message',
                    onConfirm: async () => {
                      const created = await workspaceChatApi.createMessage(selectedSpaceName.trim(), newChatMessage.trim());
                      setChatMessages(prev => [created, ...prev]);
                      setStatusMessage('Posted message to Google Chat space.');
                    }
                  })
                }
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Post to Google Chat Space
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mandatory User Confirmation Dialog Modal for Mutating / Destructive Operations */}
      {pendingConfirmation && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-2xl shrink-0 ${
                  pendingConfirmation.isDestructive ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                }`}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-900">{pendingConfirmation.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {pendingConfirmation.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isConfirming}
                onClick={() => setPendingConfirmation(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isConfirming}
                onClick={handleExecuteConfirmedAction}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer ${
                  pendingConfirmation.isDestructive
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isConfirming ? 'Processing...' : pendingConfirmation.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default GoogleWorkspaceIntegrationsPanel;
