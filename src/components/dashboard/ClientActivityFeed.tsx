import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  FileUp,
  CheckCircle2,
  Briefcase,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Plus,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Clock,
  User,
  Building2,
  FileText,
  AlertTriangle,
  X,
  Sparkles,
  ArrowRight,
  Eye,
  Trash2,
  ShieldAlert
} from 'lucide-react';
import {
  ClientActivity,
  ClientActivityType,
  ActivityStatus,
  fetchClientActivities,
  addClientActivity,
  updateActivityStatus,
  deleteClientActivity,
  resetClientActivities,
  formatRelativeTime,
  exportActivitiesToCSV
} from '../../services/clientActivityService';

interface ClientActivityFeedProps {
  compact?: boolean;
  limit?: number;
  onViewAll?: () => void;
}

export const ClientActivityFeed: React.FC<ClientActivityFeedProps> = ({
  compact = false,
  limit,
  onViewAll
}) => {
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ClientActivityType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<ActivityStatus | 'all'>('all');
  const [selectedActivity, setSelectedActivity] = useState<ClientActivity | null>(null);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form state for custom or simulated activity
  const [simType, setSimType] = useState<ClientActivityType>('document_upload');
  const [simClientName, setSimClientName] = useState('Apex Footwear Ltd');
  const [simCompany, setSimCompany] = useState('Apex Group');
  const [simEmail, setSimEmail] = useState('tax@apexfootwear.com');
  const [simTitle, setSimTitle] = useState('Uploaded Withholding Tax Challan (Sept 2026)');
  const [simDescription, setSimDescription] = useState('Proof of advance tax deduction deposited under Treasury Challan code 1-1141-0010-0111.');
  const [simPracticeArea, setSimPracticeArea] = useState('Corporate Tax & NBR');
  const [simFileName, setSimFileName] = useState('Challan_Sept2026_TDS.pdf');

  // Load activities and listen for storage/event changes
  const loadData = () => {
    setIsRefreshing(true);
    const data = fetchClientActivities();
    setActivities(data);
    setLastRefreshed(new Date());
    setTimeout(() => setIsRefreshing(false), 300);
  };

  useEffect(() => {
    loadData();

    const handleCustomUpdate = () => {
      loadData();
    };

    window.addEventListener('elawyers_client_activity_updated', handleCustomUpdate);
    window.addEventListener('storage', handleCustomUpdate);

    return () => {
      window.removeEventListener('elawyers_client_activity_updated', handleCustomUpdate);
      window.removeEventListener('storage', handleCustomUpdate);
    };
  }, []);

  // Filtered activities
  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const matchesType = selectedType === 'all' || activity.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || activity.status === selectedStatus;
      
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        activity.title.toLowerCase().includes(query) ||
        activity.clientName.toLowerCase().includes(query) ||
        activity.clientCompany.toLowerCase().includes(query) ||
        activity.referenceId.toLowerCase().includes(query) ||
        activity.practiceArea.toLowerCase().includes(query);

      return matchesType && matchesStatus && matchesSearch;
    });
  }, [activities, selectedType, selectedStatus, searchQuery]);

  // Display subset if limit provided
  const displayedActivities = limit ? filteredActivities.slice(0, limit) : filteredActivities;

  // Counts by type
  const counts = useMemo(() => {
    return {
      all: activities.length,
      document_upload: activities.filter(a => a.type === 'document_upload').length,
      task_completion: activities.filter(a => a.type === 'task_completion').length,
      service_request: activities.filter(a => a.type === 'service_request').length,
      compliance_update: activities.filter(a => a.type === 'compliance_update').length,
    };
  }, [activities]);

  const handleCopyRef = (e: React.MouseEvent, refId: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(refId);
    setCopiedId(refId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStatusChange = (activityId: string, newStatus: ActivityStatus) => {
    const updated = updateActivityStatus(activityId, newStatus);
    setActivities(updated);
    if (selectedActivity && selectedActivity.id === activityId) {
      setSelectedActivity({ ...selectedActivity, status: newStatus });
    }
  };

  const handleDelete = (activityId: string) => {
    const updated = deleteClientActivity(activityId);
    setActivities(updated);
    if (selectedActivity && selectedActivity.id === activityId) {
      setSelectedActivity(null);
    }
  };

  const handleQuickSimulate = (preset: 'upload' | 'task' | 'service') => {
    if (preset === 'upload') {
      addClientActivity({
        type: 'document_upload',
        title: 'Uploaded NBR e-Return Acknowledgment Receipt',
        description: 'Submission confirmation slip for Assessment Year 2026-27 uploaded from NBR verified portal.',
        clientName: 'Mahmudul Hasan (CFO)',
        clientCompany: 'Dhaka Tobacco Trading',
        clientEmail: 'm.hasan@dhakatobacco.com',
        status: 'verified',
        practiceArea: 'Corporate Tax & NBR',
        referenceId: `DOC-${Date.now().toString().slice(-4)}`,
        fileInfo: {
          fileName: 'NBR_eReturn_Ack_AY2026.pdf',
          fileSize: '890 KB',
          fileType: 'pdf'
        },
        sourceChannel: 'Client Portal (Web SSL)',
        notes: 'Acknowledged without discrepancies. Section 177 filing receipt attached.'
      });
    } else if (preset === 'task') {
      addClientActivity({
        type: 'task_completion',
        title: 'Completed Advance Tax Installment Verification (Q3)',
        description: 'Client finalized reconciliation of quarterly advance tax liability under Section 137 of Income Tax Act 2023.',
        clientName: 'Farhana Chowdhury',
        clientCompany: 'Pran-RFL Logistics Division',
        clientEmail: 'f.chowdhury@pran-rfl.com',
        status: 'completed',
        practiceArea: 'Income Tax Assessment',
        referenceId: `TSK-${Date.now().toString().slice(-4)}`,
        sourceChannel: 'Corporate Compliance Checklist',
        notes: 'Challan verified against Sonali Bank Treasury portal.'
      });
    } else {
      addClientActivity({
        type: 'service_request',
        title: 'Requested Trademark Opposition Filing Brief',
        description: 'Urgent service request to file objection against conflicting trademark published in Trademark Journal No. 412.',
        clientName: 'Barrister Zillur Rahman',
        clientCompany: 'Orion Biotech Labs',
        clientEmail: 'zillur@orion-bio.com',
        status: 'action_required',
        practiceArea: 'Intellectual Property & Patents',
        referenceId: `SRV-${Date.now().toString().slice(-4)}`,
        sourceChannel: 'Client Consultation Scheduler',
        notes: 'Statutory 60-day limitation window expires in 12 days.'
      });
    }
    loadData();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addClientActivity({
      type: simType,
      title: simTitle,
      description: simDescription,
      clientName: simClientName,
      clientCompany: simCompany,
      clientEmail: simEmail,
      status: simType === 'service_request' ? 'action_required' : 'in_review',
      practiceArea: simPracticeArea,
      referenceId: `${simType === 'document_upload' ? 'DOC' : simType === 'task_completion' ? 'TSK' : 'SRV'}-${Date.now().toString().slice(-4)}`,
      fileInfo: simType === 'document_upload' ? {
        fileName: simFileName || 'Uploaded_Document.pdf',
        fileSize: '1.5 MB',
        fileType: 'pdf'
      } : undefined,
      sourceChannel: 'Client Portal (Web SSL)',
      notes: 'Logged via client activity monitoring desk.'
    });
    setIsSimulateModalOpen(false);
    loadData();
  };

  // Helper icons and styles
  const getTypeBadge = (type: ClientActivityType) => {
    switch (type) {
      case 'document_upload':
        return {
          icon: FileUp,
          label: 'Document Upload',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          cardBorder: 'border-l-emerald-500'
        };
      case 'task_completion':
        return {
          icon: CheckCircle2,
          label: 'Task Completion',
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          dot: 'bg-indigo-500',
          cardBorder: 'border-l-indigo-500'
        };
      case 'service_request':
        return {
          icon: Briefcase,
          label: 'Service Request',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          cardBorder: 'border-l-amber-500'
        };
      case 'compliance_update':
        return {
          icon: ShieldCheck,
          label: 'Compliance Update',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          cardBorder: 'border-l-blue-500'
        };
    }
  };

  const getStatusBadge = (status: ActivityStatus) => {
    switch (status) {
      case 'verified':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span className="capitalize">{status}</span>
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
            <Clock className="w-3 h-3 text-blue-600 animate-spin" />
            <span>In Review</span>
          </span>
        );
      case 'action_required':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Action Required</span>
          </span>
        );
    }
  };

  // Client avatar initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('');
  };

  const getAvatarBg = (name: string) => {
    const colors = [
      'bg-emerald-100 text-emerald-800 border-emerald-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-amber-100 text-amber-900 border-amber-200',
      'bg-teal-100 text-teal-800 border-teal-200',
      'bg-slate-200 text-slate-800 border-slate-300'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <div id="client-activity-feed-widget" className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-xl font-bold text-slate-900">Client Activity Feed</h3>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Live Feed</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time audit log of client document uploads, task completions, and chamber service requests
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            onClick={() => setIsSimulateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Log new activity or simulate client event"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Client Action</span>
          </button>

          <button
            onClick={() => exportActivitiesToCSV(activities)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            title="Export full activity log as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Refresh feed"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Type Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedType === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Actions <span className="ml-1 text-[10px] text-slate-400 font-normal">({counts.all})</span>
          </button>

          <button
            onClick={() => setSelectedType('document_upload')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedType === 'document_upload'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            <FileUp className="w-3 h-3 text-emerald-600" />
            <span>Document Uploads</span>
            <span className="text-[10px] opacity-70">({counts.document_upload})</span>
          </button>

          <button
            onClick={() => setSelectedType('task_completion')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedType === 'task_completion'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-indigo-700'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-indigo-600" />
            <span>Task Completions</span>
            <span className="text-[10px] opacity-70">({counts.task_completion})</span>
          </button>

          <button
            onClick={() => setSelectedType('service_request')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedType === 'service_request'
                ? 'bg-white text-amber-800 shadow-xs'
                : 'text-slate-600 hover:text-amber-800'
            }`}
          >
            <Briefcase className="w-3 h-3 text-amber-600" />
            <span>Service Requests</span>
            <span className="text-[10px] opacity-70">({counts.service_request})</span>
          </button>
        </div>

        {/* Quick Test Action Buttons for Demonstration */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] hidden md:inline">Quick Test:</span>
          <button
            onClick={() => handleQuickSimulate('upload')}
            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-semibold border border-emerald-200 transition-colors cursor-pointer"
            title="Simulate a new document upload"
          >
            + Upload
          </button>
          <button
            onClick={() => handleQuickSimulate('task')}
            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-semibold border border-indigo-200 transition-colors cursor-pointer"
            title="Simulate task completion"
          >
            + Task
          </button>
          <button
            onClick={() => handleQuickSimulate('service')}
            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[11px] font-semibold border border-amber-200 transition-colors cursor-pointer"
            title="Simulate service request"
          >
            + Request
          </button>
        </div>
      </div>

      {/* Search and Secondary Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-6">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, company, activity title, or reference ID..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="sm:col-span-4 flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as ActivityStatus | 'all')}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="in_review">In Review</option>
            <option value="action_required">Action Required</option>
            <option value="completed">Completed</option>
            <option value="verified">Verified</option>
          </select>
        </div>
      </div>

      {/* Activities Timeline / Feed List */}
      {displayedActivities.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <Activity className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No client activities found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedType !== 'all' || selectedStatus !== 'all'
              ? 'Try adjusting your search criteria or filter options.'
              : 'Client actions such as document uploads, checklist task completions, and service requests will be streamed here in real-time.'}
          </p>
          {(searchQuery || selectedType !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
                setSelectedStatus('all');
              }}
              className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayedActivities.map((activity) => {
            const typeConfig = getTypeBadge(activity.type);
            const Icon = typeConfig.icon;

            return (
              <div
                key={activity.id}
                onClick={() => setSelectedActivity(activity)}
                className={`group p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-300 bg-white hover:bg-slate-50/70 transition-all cursor-pointer relative shadow-2xs border-l-4 ${typeConfig.cardBorder}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Left Column: Avatar & Action Details */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Client Avatar */}
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xs font-extrabold shrink-0 shadow-2xs ${getAvatarBg(
                        activity.clientName
                      )}`}
                    >
                      {getInitials(activity.clientName)}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Action Header Title */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                          {activity.title}
                        </span>
                        {getStatusBadge(activity.status)}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {activity.description}
                      </p>

                      {/* Document Attachment Box (if upload) */}
                      {activity.fileInfo && (
                        <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/80 border border-slate-200/80 text-xs text-slate-700 max-w-full">
                          <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-semibold truncate max-w-xs">{activity.fileInfo.fileName}</span>
                          <span className="text-[10px] text-slate-500 shrink-0">({activity.fileInfo.fileSize})</span>
                        </div>
                      )}

                      {/* Clean Typographic Metadata (Anti-slop dot notation) */}
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] text-slate-500 mt-2.5">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {activity.clientName}
                        </span>
                        <span>·</span>
                        <span className="text-slate-600 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {activity.clientCompany}
                        </span>
                        <span>·</span>
                        <span className="text-emerald-700 font-semibold">{activity.practiceArea}</span>
                        <span>·</span>
                        <span className="text-slate-400">{activity.sourceChannel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Timestamp & Action Controls */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatRelativeTime(activity.timestamp)}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleCopyRef(e, activity.referenceId)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                        title="Copy Reference ID"
                      >
                        {copiedId === activity.referenceId ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>{activity.referenceId}</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedActivity(activity);
                        }}
                        className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="View Full Docket Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Widget Footer */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Tracking active client audit trails & portal submissions</span>
        </div>

        <div className="flex items-center gap-3">
          {limit && filteredActivities.length > limit && onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View all {filteredActivities.length} client activities</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => {
              if (window.confirm('Reset client activity log back to initial demo events?')) {
                const initial = resetClientActivities();
                setActivities(initial);
              }
            }}
            className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            Reset Default Events
          </button>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-sm font-extrabold shadow-2xs ${getAvatarBg(
                    selectedActivity.clientName
                  )}`}
                >
                  {getInitials(selectedActivity.clientName)}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">{selectedActivity.clientName}</h4>
                  <p className="text-xs text-slate-500">
                    {selectedActivity.clientCompany} · {selectedActivity.clientEmail}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-5 space-y-5">
              {/* Status and Ref */}
              <div className="flex items-center justify-between flex-wrap gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Docket Status:</span>
                  {getStatusBadge(selectedActivity.status)}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  <span>Ref: {selectedActivity.referenceId}</span>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h5 className="text-base font-bold text-slate-900">{selectedActivity.title}</h5>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                  {selectedActivity.description}
                </p>
              </div>

              {/* Attached file if present */}
              {selectedActivity.fileInfo && (
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {selectedActivity.fileInfo.fileName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {selectedActivity.fileInfo.fileSize} · Secure PDF Client Upload
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold shrink-0">
                    Encrypted
                  </span>
                </div>
              )}

              {/* Metadata Key-Value Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Practice Area</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedActivity.practiceArea}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Source Channel</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedActivity.sourceChannel}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Timestamp</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {new Date(selectedActivity.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Relative Time</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {formatRelativeTime(selectedActivity.timestamp)}
                  </p>
                </div>
              </div>

              {/* Internal Chamber Notes */}
              {selectedActivity.notes && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 text-xs">
                  <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">
                    Internal Chamber Audit Notes
                  </p>
                  <p className="text-amber-900 leading-relaxed">{selectedActivity.notes}</p>
                </div>
              )}

              {/* Status Management Bar */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-700 mb-2">Update Activity Status:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleStatusChange(selectedActivity.id, 'verified')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      selectedActivity.status === 'verified'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    Mark Verified
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedActivity.id, 'completed')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      selectedActivity.status === 'completed'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    Mark Completed
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedActivity.id, 'in_review')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      selectedActivity.status === 'in_review'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    Set In Review
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedActivity.id, 'action_required')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      selectedActivity.status === 'action_required'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    Needs Action
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => handleDelete(selectedActivity.id)}
                className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Event</span>
              </button>

              <button
                onClick={() => setSelectedActivity(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close Docket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIMULATE / LOG ACTION MODAL */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Log New Client Activity</h4>
                  <p className="text-xs text-slate-500">Record a client document, task completion, or service brief</p>
                </div>
              </div>
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCustomSubmit} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Activity Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSimType('document_upload');
                      setSimTitle('Uploaded Income Tax Assessment Order');
                      setSimDescription('Scanned copy of assessment order under Section 73 of Income Tax Act 2023.');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-left transition-all cursor-pointer ${
                      simType === 'document_upload'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    📄 Document Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimType('task_completion');
                      setSimTitle('Completed Bank Statement TDS Reconciliation');
                      setSimDescription('Completed bank statement matching for cross-verification of taxable deductions.');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-left transition-all cursor-pointer ${
                      simType === 'task_completion'
                        ? 'bg-indigo-50 text-indigo-800 border-indigo-300 ring-2 ring-indigo-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    ✅ Task Completion
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimType('service_request');
                      setSimTitle('Requested Corporate Law & RJSC Retainer Advisory');
                      setSimDescription('New matter regarding annual filing of Form XII and director shareholding changes.');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-left transition-all cursor-pointer ${
                      simType === 'service_request'
                        ? 'bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    💼 Service Request
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimType('compliance_update');
                      setSimTitle('Updated Trade License & Fire Safety Certificate');
                      setSimDescription('Uploaded renewed Dhaka City Corporation trade license for compliance records.');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-left transition-all cursor-pointer ${
                      simType === 'compliance_update'
                        ? 'bg-blue-50 text-blue-900 border-blue-300 ring-2 ring-blue-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    🛡️ Compliance Update
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Client Name</label>
                  <input
                    type="text"
                    required
                    value={simClientName}
                    onChange={(e) => setSimClientName(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    required
                    value={simCompany}
                    onChange={(e) => setSimCompany(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Activity Title</label>
                <input
                  type="text"
                  required
                  value={simTitle}
                  onChange={(e) => setSimTitle(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Summary</label>
                <textarea
                  rows={2}
                  required
                  value={simDescription}
                  onChange={(e) => setSimDescription(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Practice Area</label>
                  <select
                    value={simPracticeArea}
                    onChange={(e) => setSimPracticeArea(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Corporate Tax & NBR">Corporate Tax & NBR</option>
                    <option value="VAT & Customs">VAT & Customs</option>
                    <option value="Corporate Law & RJSC">Corporate Law & RJSC</option>
                    <option value="Litigation & Supreme Court">Litigation & Supreme Court</option>
                    <option value="Intellectual Property & Patents">Intellectual Property & Patents</option>
                  </select>
                </div>

                {simType === 'document_upload' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Attachment Name</label>
                    <input
                      type="text"
                      value={simFileName}
                      onChange={(e) => setSimFileName(e.target.value)}
                      placeholder="e.g. Assessment_AY26.pdf"
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSimulateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Publish to Activity Feed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
