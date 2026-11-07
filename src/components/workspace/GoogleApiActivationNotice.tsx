import React, { useState } from 'react';
import { AlertTriangle, ExternalLink, RefreshCw, CheckCircle2, ShieldCheck, Sparkles, HelpCircle } from 'lucide-react';

interface GoogleApiActivationNoticeProps {
  apiName?: string;
  projectId?: string;
  errorMessage?: string;
  onRetry?: () => void | Promise<void>;
  isLoading?: boolean;
}

export function GoogleApiActivationNotice({
  apiName = 'Google Drive API',
  projectId = '56739184994',
  errorMessage,
  onRetry,
  isLoading = false,
}: GoogleApiActivationNoticeProps) {
  const [retrying, setRetrying] = useState(false);
  const [copied, setCopied] = useState(false);

  const apiEndpoints: Record<string, { id: string; name: string; url: string }> = {
    drive: {
      id: 'drive.googleapis.com',
      name: 'Google Drive API',
      url: `https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=${projectId}`
    },
    sheets: {
      id: 'sheets.googleapis.com',
      name: 'Google Sheets API',
      url: `https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=${projectId}`
    },
    calendar: {
      id: 'calendar-json.googleapis.com',
      name: 'Google Calendar API',
      url: `https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=${projectId}`
    },
    docs: {
      id: 'docs.googleapis.com',
      name: 'Google Docs API',
      url: `https://console.developers.google.com/apis/api/docs.googleapis.com/overview?project=${projectId}`
    },
    slides: {
      id: 'slides.googleapis.com',
      name: 'Google Slides API',
      url: `https://console.developers.google.com/apis/api/slides.googleapis.com/overview?project=${projectId}`
    },
    tasks: {
      id: 'tasks.googleapis.com',
      name: 'Google Tasks API',
      url: `https://console.developers.google.com/apis/api/tasks.googleapis.com/overview?project=${projectId}`
    },
    gmail: {
      id: 'gmail.googleapis.com',
      name: 'Gmail API',
      url: `https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=${projectId}`
    },
    contacts: {
      id: 'people.googleapis.com',
      name: 'People / Contacts API',
      url: `https://console.developers.google.com/apis/api/people.googleapis.com/overview?project=${projectId}`
    }
  };

  // Match key from apiName or default to drive
  const matchedKey = Object.keys(apiEndpoints).find((k) =>
    apiName.toLowerCase().includes(k)
  ) || 'drive';

  const currentApi = apiEndpoints[matchedKey];
  const directEnableUrl = currentApi.url;

  const handleRetryClick = async () => {
    if (!onRetry) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(directEnableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="rounded-3xl border-2 border-amber-400/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-6 sm:p-7 shadow-lg text-slate-800 dark:text-slate-100 animate-in fade-in space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-md shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30">
              Action Required &bull; GCP Project {projectId}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {currentApi.name} Needs to be Enabled
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
            Google Cloud requires that the <strong>{currentApi.name}</strong> is turned on for your Google Cloud Project (<strong>{projectId}</strong>) before third-party client apps can read or write data.
          </p>
        </div>
      </div>

      {/* Step by step action container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-amber-200 dark:border-amber-950/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>How to Enable (Takes 30 seconds):</span>
          </h4>
          <span className="text-[11px] text-slate-400">One-time setup per project</span>
        </div>

        <ol className="list-decimal list-inside text-xs sm:text-sm space-y-2 text-slate-700 dark:text-slate-300">
          <li>
            Open Google Cloud Console for project <strong>{projectId}</strong> by clicking the blue button below.
          </li>
          <li>
            On the Google Cloud page, click the blue <strong>"ENABLE"</strong> button.
          </li>
          <li>
            Wait 30–60 seconds for Google's systems to propagate, then click <strong>"Check & Reload"</strong> below.
          </li>
        </ol>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href={directEnableUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer"
          >
            <span>Enable {currentApi.name} in Console</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          {onRetry && (
            <button
              type="button"
              onClick={handleRetryClick}
              disabled={isLoading || retrying}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading || retrying ? 'animate-spin' : ''}`} />
              <span>{isLoading || retrying ? 'Checking API Status...' : 'Check & Reload'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyUrl}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
          >
            {copied ? 'Copied URL!' : 'Copy Enable Link'}
          </button>
        </div>
      </div>

      {/* Quick links to enable other APIs */}
      <details className="text-xs text-slate-600 dark:text-slate-400 bg-amber-500/5 p-3.5 rounded-xl border border-amber-300/30">
        <summary className="cursor-pointer font-bold hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 select-none">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Quick links to enable other Google Workspace APIs for Project {projectId}</span>
        </summary>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-amber-200/50 dark:border-slate-800">
          {Object.entries(apiEndpoints).map(([k, item]) => (
            <a
              key={k}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-blue-600 hover:border-blue-400 font-medium text-[11px] flex items-center justify-between transition group"
            >
              <span>{item.name}</span>
              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-500 shrink-0" />
            </a>
          ))}
        </div>
      </details>

      {errorMessage && (
        <div className="p-3 bg-slate-900 text-slate-300 font-mono text-[11px] rounded-xl overflow-x-auto border border-slate-800">
          <span className="text-amber-400 font-bold">Google API Response: </span>
          {errorMessage}
        </div>
      )}
    </div>
  );
}
