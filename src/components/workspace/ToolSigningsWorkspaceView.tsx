import React, { useEffect, useState, useMemo } from 'react';
import { 
  fetchAllToolSignings, 
  deleteToolSigning, 
  exportToolSigningsCsv, 
  ToolSigningRecord 
} from '../../services/toolSigningService';
import { 
  Users, 
  FileSpreadsheet, 
  Search, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  ExternalLink, 
  Clock, 
  Activity,
  Layers,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ToolSigningsWorkspaceView: React.FC = () => {
  const [signings, setSignings] = useState<ToolSigningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAllToolSignings();
      setSignings(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to real-time events triggered when a tool is accessed
    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener('elaw_tool_signing_updated', handleUpdate);
    return () => {
      window.removeEventListener('elaw_tool_signing_updated', handleUpdate);
    };
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteToolSigning(id);
      setSignings(prev => prev.filter(s => s.id !== id));
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    signings.forEach(s => {
      if (s.toolCategory) set.add(s.toolCategory);
    });
    return Array.from(set);
  }, [signings]);

  const filteredSignings = useMemo(() => {
    return signings.filter(item => {
      const matchesSearch = 
        item.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.toolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.toolId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'ALL' || item.toolCategory === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [signings, searchQuery, categoryFilter]);

  // Key KPI metrics
  const totalSignings = signings.length;
  const uniqueUsers = new Set(signings.map(s => s.userEmail)).size;
  const activeToolsCount = new Set(signings.map(s => s.toolId)).size;
  const latestSignedTime = signings.length > 0 ? signings[0].formattedDate : 'No sessions recorded yet';

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{totalSignings}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tool Signings</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{uniqueUsers}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unique Members</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{activeToolsCount}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Tools</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-bold text-slate-900 truncate">{latestSignedTime}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Latest Session</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Category Filter, CSV Export, Refresh */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by member name, email, or tool..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              aria-label="Filter by tool category"
              className="bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => exportToolSigningsCsv(filteredSignings)}
            disabled={filteredSignings.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export CSV
          </button>

          <button
            onClick={loadData}
            title="Refresh Ledger"
            aria-label="Refresh signing records"
            className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Member Tool Signing Ledger</h3>
            <p className="text-xs text-slate-500">
              Real-time audit log of members utilizing compliance and calculation tools freely via sign-in.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
            {filteredSignings.length} {filteredSignings.length === 1 ? 'Record' : 'Records'}
          </span>
        </div>

        {loading && (
          <div className="p-12 text-center text-slate-500">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading signing records...
          </div>
        )}

        {!loading && filteredSignings.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">No tool signing records found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              When members access any tool on <Link to="/tools" className="text-blue-600 underline">/tools</Link> or <Link to="/tax-calculator" className="text-blue-600 underline">/tax-calculator</Link>, their free session is logged here automatically.
            </p>
          </div>
        )}

        {!loading && filteredSignings.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-black">
                  <th className="py-3.5 px-4 text-black font-extrabold">Member / User</th>
                  <th className="py-3.5 px-4 text-black font-extrabold">Tool Accessed</th>
                  <th className="py-3.5 px-4 text-black font-extrabold">Category</th>
                  <th className="py-3.5 px-4 text-black font-extrabold">Date &amp; Time (BST)</th>
                  <th className="py-3.5 px-4 text-black font-extrabold">Access Type</th>
                  <th className="py-3.5 px-4 text-right text-black font-extrabold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSignings.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* User Info */}
                    <td className="py-3.5 px-4 text-black">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {item.userName.charAt(0) || 'U'}
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-semibold text-black truncate">{item.userName}</div>
                          <div className="text-xs text-slate-600 font-mono truncate">{item.userEmail}</div>
                        </div>
                      </div>
                    </td>

                    {/* Tool */}
                    <td className="py-3.5 px-4 text-black font-medium">
                      <div className="flex items-center gap-2">
                        <Link 
                          to={item.toolPath} 
                          className="text-blue-700 hover:text-blue-900 font-bold hover:underline flex items-center gap-1.5"
                        >
                          {item.toolName}
                          <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                        </Link>
                      </div>
                      <div className="text-xs text-slate-500 font-mono">{item.toolPath}</div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 text-black">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                        {item.toolCategory}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4 text-black whitespace-nowrap">
                      <div className="font-mono text-xs font-semibold text-black">{item.formattedDate}</div>
                      <div className="text-[11px] text-slate-500">{item.authProvider}</div>
                    </td>

                    {/* Access Status */}
                    <td className="py-3.5 px-4 text-black whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        Free · Unlocked
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right text-black whitespace-nowrap">
                      {confirmDeleteId === item.id ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold cursor-pointer"
                          >
                            {deletingId === item.id ? 'Removing...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(item.id)}
                          disabled={deletingId === item.id}
                          title="Delete Record"
                          aria-label={`Delete record for ${item.userName}`}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
