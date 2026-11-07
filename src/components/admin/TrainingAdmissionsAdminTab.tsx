import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  FileSpreadsheet,
  Copy,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Filter,
  CheckCheck,
  UserCheck
} from 'lucide-react';
import {
  TrainingAdmissionRecord,
  fetchTrainingAdmissionsFromFirestore,
  subscribeTrainingAdmissions,
  updateTrainingAdmissionStatus,
} from '../../services/trainingAdmissionFirestoreService';
import {
  syncTrainingAdmissionsToSheet,
  getStoredTrainingSheetId,
} from '../../services/trainingSheetsSync';
import { getAccessToken, getConnectedWorkspaceEmail } from '../../services/workspaceAuth';

export const TrainingAdmissionsAdminTab: React.FC = () => {
  const [admissions, setAdmissions] = useState<TrainingAdmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Google Sheets sync state
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [sheetSyncResult, setSheetSyncResult] = useState<{
    success: boolean;
    syncedCount: number;
    spreadsheetUrl: string;
  } | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const workspaceToken = getAccessToken();
  const connectedWorkspaceEmail = getConnectedWorkspaceEmail();
  const currentSheetId = getStoredTrainingSheetId();

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchTrainingAdmissionsFromFirestore();
      setAdmissions(data);
    } catch (err: any) {
      console.warn('Failed to load training admissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();

    const unsubscribe = subscribeTrainingAdmissions((live) => {
      if (live && live.length > 0) {
        setAdmissions(live);
        setLoading(false);
      }
    });

    const handleLocal = (e: any) => {
      if (e?.detail) {
        setAdmissions((prev) => {
          const idx = prev.findIndex((p) => p.id === e.detail.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = e.detail;
            return next;
          }
          return [e.detail, ...prev];
        });
      }
    };

    window.addEventListener('training_admission_saved', handleLocal);
    window.addEventListener('training_admission_status_updated', (e: any) => {
      if (e?.detail) {
        setAdmissions((prev) =>
          prev.map((item) =>
            item.id === e.detail.id
              ? { ...item, status: e.detail.status, approvedAt: e.detail.approvedAt }
              : item
          )
        );
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener('training_admission_saved', handleLocal);
    };
  }, []);

  const courseOptions = useMemo(() => {
    const map = new Map<string, string>();
    admissions.forEach((item) => {
      if (item.courseId && item.courseName) {
        map.set(item.courseId, item.courseName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [admissions]);

  const filteredAdmissions = useMemo(() => {
    return admissions.filter((item) => {
      const matchesSearch =
        item.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchesCourse = courseFilter === 'ALL' || item.courseId === courseFilter;

      return matchesSearch && matchesStatus && matchesCourse;
    });
  }, [admissions, searchQuery, statusFilter, courseFilter]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUpdateStatus = async (id: string, status: 'pending' | 'approved' | 'rejected') => {
    try {
      await updateTrainingAdmissionStatus(id, status);
      setNotification({
        type: 'success',
        text: `Application [${id}] status updated to ${status.toUpperCase()}! Applicant access in /student/dashboard updated.`,
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err?.message || 'Failed to update admission status.',
      });
    }
  };

  const handleSyncSheet = async () => {
    if (filteredAdmissions.length === 0) return;
    setIsSyncingSheet(true);
    setNotification(null);
    try {
      const res = await syncTrainingAdmissionsToSheet(filteredAdmissions);
      setSheetSyncResult(res);
      setNotification({
        type: 'success',
        text: `Successfully synced ${res.syncedCount} training admission(s) to Google Sheets in /workspace!`,
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err?.message || 'Failed to sync training admissions to Google Sheets.',
      });
    } finally {
      setIsSyncingSheet(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Metrics */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-emerald-500/30">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Training Admission &amp; Student Access Desk</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Academy Admissions &amp; Dashboard Approval Ledger
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Review training course applications, approve student access to <code className="text-emerald-300 bg-slate-800 px-1.5 py-0.5 rounded font-mono">/student/dashboard</code> (view-only by course name), and sync directly to Google Sheets in <code className="text-cyan-300 bg-slate-800 px-1.5 py-0.5 rounded font-mono">/workspace</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={loadData}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs inline-flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Applications</span>
          </button>

          <button
            type="button"
            onClick={handleSyncSheet}
            disabled={isSyncingSheet || filteredAdmissions.length === 0}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-2 transition shadow-lg cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className={`w-4 h-4 ${isSyncingSheet ? 'animate-bounce' : ''}`} />
            <span>{isSyncingSheet ? 'Syncing Sheet...' : 'Sync to Google Sheet (/workspace)'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Applications</div>
          <div className="text-2xl font-black text-slate-900">{admissions.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Approved Students</div>
          <div className="text-2xl font-black text-emerald-900">{admissions.filter((a) => a.status === 'approved').length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Review</div>
          <div className="text-2xl font-black text-amber-900">{admissions.filter((a) => a.status === 'pending').length}</div>
        </div>
      </div>

      {/* Visual Summary Chart Card: Pending vs. Approved Applications */}
      {(() => {
        const totalCount = admissions.length;
        const approvedCount = admissions.filter((a) => a.status === 'approved').length;
        const pendingCount = admissions.filter((a) => a.status === 'pending').length;
        const rejectedCount = admissions.filter((a) => a.status === 'rejected').length;

        const approvedPercent = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;
        const pendingPercent = totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0;
        const rejectedPercent = totalCount > 0 ? Math.round((rejectedCount / totalCount) * 100) : 0;

        return (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Application Status Breakdown & Approval Rate
                </h3>
                <p className="text-xs text-slate-500">
                  Visual proportion of approved, pending review, and rejected student applications.
                </p>
              </div>
              <div className="text-xs font-mono tabular-nums text-slate-600 font-bold bg-slate-100 px-2.5 py-1 rounded-lg">
                Total: {totalCount} Applications
              </div>
            </div>

            {/* Segmented Progress Bar Chart */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                {approvedCount > 0 && (
                  <div
                    style={{ width: `${approvedPercent}%` }}
                    className="bg-emerald-600 h-full transition-all duration-500"
                    title={`Approved: ${approvedCount} (${approvedPercent}%)`}
                  />
                )}
                {pendingCount > 0 && (
                  <div
                    style={{ width: `${pendingPercent}%` }}
                    className="bg-amber-500 h-full transition-all duration-500"
                    title={`Pending: ${pendingCount} (${pendingPercent}%)`}
                  />
                )}
                {rejectedCount > 0 && (
                  <div
                    style={{ width: `${rejectedPercent}%` }}
                    className="bg-rose-500 h-full transition-all duration-500"
                    title={`Rejected: ${rejectedCount} (${rejectedPercent}%)`}
                  />
                )}
                {totalCount === 0 && <div className="w-full bg-slate-200 h-full" />}
              </div>

              {/* Chart Legend */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block shrink-0" />
                  <span className="text-slate-700 font-semibold">
                    Approved: <strong className="text-slate-900">{approvedCount}</strong> ({approvedPercent}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shrink-0" />
                  <span className="text-slate-700 font-semibold">
                    Pending Review: <strong className="text-slate-900">{pendingCount}</strong> ({pendingPercent}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shrink-0" />
                  <span className="text-slate-700 font-semibold">
                    Rejected: <strong className="text-slate-900">{rejectedCount}</strong> ({rejectedPercent}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>

          <div className="flex items-center gap-2">
            {sheetSyncResult?.spreadsheetUrl && (
              <a
                href={sheetSyncResult.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition"
              >
                <span>Open Google Sheet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="p-1 hover:bg-black/10 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by applicant name, email, phone, or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">All Statuses ({admissions.length})</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              aria-label="Filter by specific course"
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 max-w-[220px] truncate"
            >
              <option value="ALL">All Courses ({admissions.length})</option>
              {courseOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-bold shrink-0 text-right">
          Showing <span className="text-slate-900 font-black">{filteredAdmissions.length}</span> applications
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-bold text-slate-600">Loading training admissions from Firestore...</p>
          </div>
        ) : filteredAdmissions.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No training admission applications found</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              When students apply from the Training Hub, their applications will appear here for admin review and student dashboard access approval.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-950 font-black uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-3.5 border-r border-slate-200">Application ID</th>
                  <th className="py-3 px-3.5 border-r border-slate-200">Applicant Details</th>
                  <th className="py-3 px-3.5 border-r border-slate-200">Selected Course</th>
                  <th className="py-3 px-3.5 border-r border-slate-200">Qualification &amp; Exp</th>
                  <th className="py-3 px-3.5 border-r border-slate-200">Dashboard Status</th>
                  <th className="py-3 px-3.5 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-950 font-medium">
                {filteredAdmissions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* ID */}
                    <td className="py-3 px-3.5 border-r border-slate-100 font-mono font-bold text-blue-950 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{item.id}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.id, item.id)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                          title="Copy application ID"
                        >
                          {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-500 font-sans font-normal mt-0.5">
                        {new Date(item.appliedAt).toLocaleString()}
                      </div>
                    </td>

                    {/* Applicant Details */}
                    <td className="py-3 px-3.5 border-r border-slate-100">
                      <div className="font-bold text-slate-900">{item.applicantName}</div>
                      <div className="font-mono text-[11px] text-slate-600">{item.email}</div>
                      <div className="font-mono text-[11px] text-slate-500">{item.phone}</div>
                    </td>

                    {/* Course */}
                    <td className="py-3 px-3.5 border-r border-slate-100">
                      <div className="font-bold text-slate-900 max-w-[220px] truncate">{item.courseName}</div>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {item.courseId}
                      </span>
                    </td>

                    {/* Qualification */}
                    <td className="py-3 px-3.5 border-r border-slate-100">
                      <div className="text-slate-800 font-semibold">{item.qualification}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.experience}</div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3.5 border-r border-slate-100 whitespace-nowrap">
                      {item.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          <span>Approved (Access Granted)</span>
                        </span>
                      ) : item.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-700" />
                          <span>Rejected</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>Pending Review</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {item.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(item.id, 'approved')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Approve &amp; Grant Access</span>
                          </button>
                        )}
                        {item.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(item.id, 'rejected')}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] transition cursor-pointer"
                          >
                            <span>Reject</span>
                          </button>
                        )}
                        {item.status === 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(item.id, 'pending')}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition cursor-pointer"
                          >
                            <span>Reset to Pending</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingAdmissionsAdminTab;
