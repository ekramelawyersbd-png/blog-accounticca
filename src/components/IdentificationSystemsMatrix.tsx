import React, { useState, useMemo } from 'react';
import { Search, Filter, ShieldCheck, Globe, Building2, CreditCard, Scale, X } from 'lucide-react';
import { IDENTIFICATION_SYSTEMS_DATA, IdentificationSystemRecord } from '../data/identificationRegistrationSystemsArticle';

type DomainFilter = 'ALL' | IdentificationSystemRecord['domain'];

export function IdentificationSystemsMatrix() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<DomainFilter>('ALL');

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: IDENTIFICATION_SYSTEMS_DATA.length };
    for (const item of IDENTIFICATION_SYSTEMS_DATA) {
      map[item.domain] = (map[item.domain] || 0) + 1;
    }
    return map;
  }, []);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return IDENTIFICATION_SYSTEMS_DATA.filter((item) => {
      if (selectedDomain !== 'ALL' && item.domain !== selectedDomain) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.acronym.toLowerCase().includes(q) ||
        item.issuingEntity.toLowerCase().includes(q) ||
        item.legalBasis.toLowerCase().includes(q) ||
        item.format.toLowerCase().includes(q) ||
        item.purpose.toLowerCase().includes(q) ||
        item.fee.toLowerCase().includes(q) ||
        item.timeline.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedDomain]);

  const domainTabs: { id: DomainFilter; label: string; icon: React.ReactNode }[] = [
    { id: 'ALL', label: `All Systems (${counts['ALL'] || 0})`, icon: <Globe className="w-3.5 h-3.5" /> },
    {
      id: 'Bangladesh Tax & Regulatory',
      label: `Bangladesh NBR / RJSC / Trade (${counts['Bangladesh Tax & Regulatory'] || 0})`,
      icon: <ShieldCheck className="w-3.5 h-3.5" />
    },
    {
      id: 'Canada CRA & Corporate',
      label: `Canada CRA & Registry (${counts['Canada CRA & Corporate'] || 0})`,
      icon: <Building2 className="w-3.5 h-3.5" />
    },
    {
      id: 'Global Payment & ISO (BIN/IIN)',
      label: `ISO 7812 / Card BIN & IIN (${counts['Global Payment & ISO (BIN/IIN)'] || 0})`,
      icon: <CreditCard className="w-3.5 h-3.5" />
    },
    {
      id: 'US Municipal & Corporate',
      label: `US Municipal & Corporate (${counts['US Municipal & Corporate'] || 0})`,
      icon: <Scale className="w-3.5 h-3.5" />
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden my-8 not-prose">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 md:p-8 border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-md mb-2">
              <Filter className="w-3 h-3" /> Interactive Reference Explorer
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-white">
              Identification & Registration Systems Directory (71 Systems)
            </h3>
            <p className="text-xs md:text-sm text-slate-300 mt-1">
              Filter by regulatory jurisdiction or search by acronym (e.g., TIN, BIN, WIN, IRC, ERC, DBID, BN, RT, IIN, PAN), governing authority, or legal statute.
            </p>
          </div>
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search TIN, BIN, WIN, RJSC, ISO 7812..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {domainTabs.map((tab) => {
            const active = selectedDomain === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedDomain(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                  active
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-xs'
                    : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Bar */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <span>
          Showing <strong className="text-slate-900">{filteredRecords.length}</strong> of{' '}
          <strong className="text-slate-900">{IDENTIFICATION_SYSTEMS_DATA.length}</strong> identification & registration systems
        </span>
        {(searchQuery || selectedDomain !== 'ALL') && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedDomain('ALL');
            }}
            className="text-emerald-700 font-bold hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto max-h-[680px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-slate-100 text-slate-800 border-b border-slate-200 shadow-2xs">
            <tr>
              <th className="py-3.5 px-4 font-bold min-w-[180px]">Identifier / Registration Name</th>
              <th className="py-3.5 px-4 font-bold min-w-[130px]">Acronym / Alternate Name</th>
              <th className="py-3.5 px-4 font-bold min-w-[180px]">Issuing / Governing Entity</th>
              <th className="py-3.5 px-4 font-bold min-w-[170px]">Standard or Legal Basis</th>
              <th className="py-3.5 px-4 font-bold min-w-[140px]">Digits or Format</th>
              <th className="py-3.5 px-4 font-bold min-w-[260px]">Primary Purpose or Scope</th>
              <th className="py-3.5 px-4 font-bold min-w-[160px]">Application / Registration Fee</th>
              <th className="py-3.5 px-4 font-bold min-w-[160px]">Processing Timeline</th>
              <th className="py-3.5 px-4 font-bold whitespace-nowrap">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500 text-sm">
                  No identification or registration systems matched your filter criteria.
                </td>
              </tr>
            ) : (
              filteredRecords.map((row) => (
                <tr key={row.id} className="hover:bg-emerald-50/40 transition-colors align-top">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div>{row.name}</div>
                    <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {row.domain}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-700">{row.acronym}</td>
                  <td className="py-3.5 px-4 text-slate-700">{row.issuingEntity}</td>
                  <td className="py-3.5 px-4 text-slate-600">{row.legalBasis}</td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-800">{row.format}</td>
                  <td className="py-3.5 px-4 text-slate-600 leading-relaxed">{row.purpose}</td>
                  <td className="py-3.5 px-4 text-slate-700">{row.fee}</td>
                  <td className="py-3.5 px-4 text-slate-600">{row.timeline}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">{row.source}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
