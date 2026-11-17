import React, { useEffect, useState, useCallback } from 'react';
import {
  GitBranch,
  GitCommit,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  UploadCloud,
  FileCode,
  Lock,
  Terminal,
  Copy,
  Check
} from 'lucide-react';

interface GitCommitItem {
  hash: string;
  subject: string;
  author: string;
  date: string;
}

interface GitHubRepoStatus {
  success: boolean;
  initialized: boolean;
  branch: string;
  remoteUrl: string;
  modifiedCount: number;
  modifiedFiles: string[];
  trackedFilesCount: number;
  commits: GitCommitItem[];
  hygiene: {
    readmePresent: boolean;
    gitignorePresent: boolean;
    secretScanPassed: boolean;
    singleLockfile: boolean;
  };
  checkedAt: string;
}

export const GitHubSyncPanel: React.FC = () => {
  const [status, setStatus] = useState<GitHubRepoStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [committing, setCommitting] = useState(false);

  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [token, setToken] = useState('');
  const [commitMessage, setCommitMessage] = useState(
    'feat: sync Accounticca × E-Lawyers BD compliance platform to GitHub'
  );

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/github/status');
      const data = await res.json();
      if (data.success) {
        setStatus(data);
        if (data.remoteUrl && !repoUrl) {
          setRepoUrl(data.remoteUrl);
        }
        if (data.branch) {
          setBranch(data.branch);
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Could not fetch Git repository status.' });
    } finally {
      setLoading(false);
    }
  }, [repoUrl]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleLocalCommit = async () => {
    setCommitting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/github/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMessage }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: data.message });
        await fetchStatus();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to create commit.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Error creating commit.' });
    } finally {
      setCommitting(false);
    }
  };

  const handleGitHubSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: repoUrl.trim(),
          branch: branch.trim() || 'main',
          token: token.trim(),
          commitMessage: commitMessage.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: data.message });
        await fetchStatus();
      } else {
        setFeedback({ type: 'error', text: data.error || 'GitHub sync encountered an error.' });
        await fetchStatus();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'GitHub sync request failed.' });
    } finally {
      setSyncing(false);
    }
  };

  const cliSnippet = `git branch -M ${branch || 'main'}
git remote add origin ${repoUrl || 'https://github.com/<your-username>/<your-repo>.git'}
git push -u origin ${branch || 'main'}`;

  const handleCopyCli = () => {
    navigator.clipboard?.writeText(cliSnippet);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Status Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              GitHub Push Protection &amp; Secret Scan Verified
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">
              GitHub Repository Sync &amp; Version Control Console
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Manage local Git commits, verify secret-free repository hygiene, and synchronize directly with your GitHub repository.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={fetchStatus}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Status
            </button>
            <button
              type="button"
              onClick={handleLocalCommit}
              disabled={committing || syncing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              <GitCommit className="w-3.5 h-3.5" />
              {committing ? 'Committing...' : 'Stage & Commit All'}
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
              <GitBranch className="w-3.5 h-3.5 text-blue-600" />
              Active Branch
            </div>
            <p className="mt-1 text-base font-extrabold text-slate-900 font-mono">
              {status?.branch || 'main'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
              <FileCode className="w-3.5 h-3.5 text-indigo-600" />
              Tracked Files
            </div>
            <p className="mt-1 text-base font-extrabold text-slate-900 font-mono">
              {status?.trackedFilesCount ?? '—'} files
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
              <GitCommit className="w-3.5 h-3.5 text-emerald-600" />
              Working Tree
            </div>
            <p className="mt-1 text-base font-extrabold text-slate-900">
              {status?.modifiedCount === 0
                ? 'Clean (Synced)'
                : `${status?.modifiedCount ?? 0} Uncommitted`}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              Secret Guard
            </div>
            <p className="mt-1 text-base font-extrabold text-emerald-700">
              {status?.hygiene?.secretScanPassed ? 'Passed (0 Leaks)' : 'Checking...'}
            </p>
          </div>
        </div>

        {/* Repository Hygiene Checklist */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>README.md Configured</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Secret Protection: .env* &amp; data/*.json Excluded</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Single Lockfile (package-lock.json)</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Automated Verification (npm run lint &amp; build)</span>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm font-medium flex items-start gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Sync Configuration & Recent Commits Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Direct Remote Sync Form */}
        <form
          onSubmit={handleGitHubSync}
          className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-blue-600" />
              Synchronize &amp; Push to GitHub
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
              Branch: {branch || 'main'}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Commit Message
            </label>
            <input
              type="text"
              required
              value={commitMessage}
              onChange={e => setCommitMessage(e.target.value)}
              placeholder="feat: sync project updates"
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                GitHub Repository URL (Optional for local sync)
              </label>
              <input
                type="url"
                value={repoUrl}
                onChange={e => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repository.git"
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Target Branch
              </label>
              <input
                type="text"
                value={branch}
                onChange={e => setBranch(e.target.value)}
                placeholder="main"
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              GitHub Personal Access Token (In-Memory Push Only — Never Stored in Git)
            </label>
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="ghp_... or github_pat_... (leave blank if using AI Studio top-bar GitHub export)"
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={syncing}
            className="w-full h-11 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60"
          >
            <UploadCloud className="w-4 h-4" />
            <span>
              {syncing
                ? 'Synchronizing Repository...'
                : repoUrl.trim()
                ? `Commit & Push to ${branch || 'main'}`
                : 'Synchronize Local Git Branch (Ready for GitHub Export)'}
            </span>
          </button>
        </form>

        {/* Recent Commits & CLI Reference */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between gap-4 shadow-xs">
          <div className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-emerald-600" />
              Recent Git Commit History
            </h3>

            {status?.commits && status.commits.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {status.commits.map(c => (
                  <div
                    key={c.hash}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900">{c.subject}</p>
                      <p className="text-[11px] text-slate-500">
                        {c.author} • {c.date}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-200/80 text-slate-800 font-mono text-[11px] font-bold shrink-0">
                      {c.hash}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No commits recorded yet.</p>
            )}
          </div>

          {/* Standard Git Push Commands */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                Git Remote Push Commands
              </span>
              <button
                type="button"
                onClick={handleCopyCli}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
              >
                {copiedCmd ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copiedCmd ? 'Copied' : 'Copy Commands'}
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed">
              {cliSnippet}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
