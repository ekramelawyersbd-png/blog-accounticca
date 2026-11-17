import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Mail,
  Building2,
  Clock,
  Copy,
  Check,
  Search,
  Scale,
  FileCheck2,
  ExternalLink,
  Calendar,
  Landmark,
  ShieldCheck,
  ChevronRight,
  Compass,
} from 'lucide-react';
import {
  BANGLADESH_TAX_JURISDICTIONS,
  DivisionId,
  DivisionTaxJurisdiction,
  TaxZoneOffice,
} from '../../data/bangladeshTaxJurisdictions';
import { buildAppointmentUrl } from '../../utils/appointmentRedirect';

interface SearchResultItem {
  divisionId: DivisionId;
  divisionName: string;
  officeId: string;
  zoneName: string;
  matchHint: string;
}

export const BangladeshTaxMapExplorer: React.FC = () => {
  const [selectedDivisionId, setSelectedDivisionId] = useState<DivisionId>('dhaka');
  const [hoveredDivisionId, setHoveredDivisionId] = useState<DivisionId | null>(null);
  const [selectedOfficeIdByDivision, setSelectedOfficeIdByDivision] = useState<
    Record<string, string>
  >({
    dhaka: 'dhaka-zone-1',
    chattogram: 'ctg-zone-1',
    rajshahi: 'rajshahi-zone',
    khulna: 'khulna-zone',
    sylhet: 'sylhet-zone-main',
    rangpur: 'rangpur-zone',
    barishal: 'barishal-zone',
    mymensingh: 'mymensingh-zone',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'offices' | 'compliance' | 'matrix'>('offices');

  const selectedDivision: DivisionTaxJurisdiction = useMemo(() => {
    return (
      BANGLADESH_TAX_JURISDICTIONS.find((d) => d.id === selectedDivisionId) ||
      BANGLADESH_TAX_JURISDICTIONS[0]
    );
  }, [selectedDivisionId]);

  const hoveredDivision: DivisionTaxJurisdiction | null = useMemo(() => {
    if (!hoveredDivisionId) return null;
    return BANGLADESH_TAX_JURISDICTIONS.find((d) => d.id === hoveredDivisionId) || null;
  }, [hoveredDivisionId]);

  const activeOffice: TaxZoneOffice = useMemo(() => {
    const preferredId = selectedOfficeIdByDivision[selectedDivision.id];
    return (
      selectedDivision.offices.find((o) => o.id === preferredId) || selectedDivision.offices[0]
    );
  }, [selectedDivision, selectedOfficeIdByDivision]);

  const searchResults: SearchResultItem[] = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const results: SearchResultItem[] = [];
    BANGLADESH_TAX_JURISDICTIONS.forEach((div) => {
      div.offices.forEach((office) => {
        const areaMatch = office.coverageAreas.find((a) => a.toLowerCase().includes(q));
        const circleMatch = office.dctCircles.find((c) => c.toLowerCase().includes(q));
        const textPool = [
          div.name,
          div.bnName,
          div.headquarters,
          office.zoneName,
          office.address,
          office.focusSector,
          office.eReturnZoneCode,
        ]
          .join(' ')
          .toLowerCase();

        if (areaMatch || circleMatch || textPool.includes(q)) {
          results.push({
            divisionId: div.id,
            divisionName: div.name,
            officeId: office.id,
            zoneName: office.zoneName,
            matchHint: areaMatch || circleMatch || office.focusSector,
          });
        }
      });
    });
    return results;
  }, [searchQuery]);

  const handleSelectDivision = (divId: DivisionId) => {
    setSelectedDivisionId(divId);
  };

  const handleSelectOffice = (divId: DivisionId, officeId: string) => {
    setSelectedDivisionId(divId);
    setSelectedOfficeIdByDivision((prev) => ({
      ...prev,
      [divId]: officeId,
    }));
  };

  const handleCopy = async (key: string, value: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      }
      setCopiedField(key);
      setTimeout(() => setCopiedField(null), 1800);
    } catch {
      // Fallback ignored gracefully
    }
  };

  const getRegionFill = (div: DivisionTaxJurisdiction) => {
    const isSelected = div.id === selectedDivisionId;
    const isHovered = div.id === hoveredDivisionId;
    if (isSelected) return '#047857';
    if (isHovered) return '#10b981';
    if (div.minimumTaxAmount >= 5000) return '#d1fae5';
    return '#e2f2eb';
  };

  const getRegionTextFill = (div: DivisionTaxJurisdiction) => {
    const isSelected = div.id === selectedDivisionId;
    const isHovered = div.id === hoveredDivisionId;
    if (isSelected || isHovered) return '#ffffff';
    return '#0f172a';
  };

  const googleMapsOfficeUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${activeOffice.zoneName} ${activeOffice.address}`
  )}`;

  return (
    <div className="space-y-6">
      {/* Top Search & Quick Division Selector Strip */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-emerald-800">
              National Board of Revenue · Regional Jurisdiction Directory
            </p>
            <h2 className="text-lg sm:text-xl font-bold text-slate-950 mt-0.5">
              Click a Bangladesh Division to Inspect DCT Offices &amp; Tax Rules
            </h2>
          </div>

          <div className="relative w-full lg:w-96">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Gulshan, Agrabad, Gazipur, LTU, EPZ, Tea..."
              aria-label="Search Bangladesh tax zones, circles, districts, or industries"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/15"
            />
          </div>
        </div>

        {/* Live Search Matches */}
        {searchQuery.trim() && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            {searchResults.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-600 px-1">
                  {searchResults.length} matching NBR Tax Zone
                  {searchResults.length === 1 ? '' : 's'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {searchResults.map((res) => (
                    <button
                      key={`${res.divisionId}-${res.officeId}`}
                      type="button"
                      onClick={() => {
                        handleSelectOffice(res.divisionId, res.officeId);
                        setActiveTab('offices');
                        setSearchQuery('');
                      }}
                      className="text-left rounded-lg border border-slate-200 bg-white px-3 py-2.5 hover:border-emerald-500 hover:bg-emerald-50/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {res.zoneName}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {res.divisionName} · {res.matchHint}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 px-1">
                No matching Tax Zone or Thana found for &ldquo;{searchQuery}&rdquo;. Try searching a
                division name, city, or sector (e.g. Dhaka, Chattogram, Benapole, EPZ, LTU).
              </p>
            )}
          </div>
        )}

        {/* Quick Keyboard/Touch Division Switcher */}
        <div
          className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100"
          role="tablist"
          aria-label="Select Bangladesh division"
        >
          {BANGLADESH_TAX_JURISDICTIONS.map((div) => {
            const active = div.id === selectedDivisionId;
            return (
              <button
                key={div.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleSelectDivision(div.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-950'
                }`}
              >
                {div.name.replace(' Division', '')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split Workspace: Interactive Bangladesh Map + Jurisdiction Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Clickable Cartographic Vector Map of Bangladesh */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-700" aria-hidden="true" />
              <span className="text-sm font-bold text-slate-950">
                Bangladesh Tax Jurisdiction Map
              </span>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              8 Divisions · {selectedDivision.offices.length} Key Hubs Shown
            </span>
          </div>

          {/* Interactive SVG Map Container */}
          <div className="relative rounded-xl border border-slate-200/80 bg-gradient-to-b from-slate-50 via-slate-50 to-sky-50/70 p-2 sm:p-3 overflow-hidden">
            {/* Hover / Active HUD Readout */}
            <div className="flex items-center justify-between gap-2 px-2 py-1.5 mb-1 text-xs bg-white/90 border border-slate-200/80 rounded-lg">
              <span className="font-semibold text-slate-800 truncate">
                {hoveredDivision
                  ? `${hoveredDivision.name} — ${hoveredDivision.totalTaxZones} Tax Zone${
                      hoveredDivision.totalTaxZones > 1 ? 's' : ''
                    }`
                  : `Selected: ${selectedDivision.name}`}
              </span>
              <span className="font-mono text-[11px] font-bold text-emerald-800 tabular-nums shrink-0">
                Min Tax ৳{(hoveredDivision || selectedDivision).minimumTaxAmount.toLocaleString()}
              </span>
            </div>

            <svg
              viewBox="0 0 560 720"
              role="img"
              aria-label="Interactive clickable map of Bangladesh divisions and regional tax offices"
              className="w-full h-auto max-h-[540px] select-none"
            >
              <defs>
                <pattern
                  id="map-grid"
                  width="28"
                  height="28"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 28 0 L 0 0 0 28"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="0.5"
                    strokeOpacity="0.4"
                  />
                </pattern>
                <linearGradient id="bay-bengal" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.45" />
                </linearGradient>
              </defs>

              {/* Subtle Topographic Grid & Bay of Bengal Backdrop */}
              <rect x="0" y="0" width="560" height="720" fill="url(#map-grid)" rx="12" />
              <path
                d="M 40 530 Q 220 560 410 530 L 520 710 L 40 710 Z"
                fill="url(#bay-bengal)"
              />

              {/* Major River Guides (Jamuna-Padma-Meghna System) rendered beneath boundaries */}
              <g
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeOpacity="0.35"
                pointerEvents="none"
              >
                <path d="M 218 92 Q 214 190 218 285 Q 245 360 288 430 Q 305 495 304 548" />
                <path d="M 78 248 Q 145 292 212 338 Q 258 374 295 422" />
                <path d="M 326 248 Q 332 325 304 412" />
              </g>

              {/* Clickable Division Polygons */}
              {BANGLADESH_TAX_JURISDICTIONS.map((div) => {
                const isSelected = div.id === selectedDivisionId;
                const isHovered = div.id === hoveredDivisionId;
                const shortName = div.name.replace(' Division', '');

                return (
                  <g
                    key={div.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={`Select ${div.name} regional tax offices`}
                    onClick={() => handleSelectDivision(div.id)}
                    onMouseEnter={() => setHoveredDivisionId(div.id)}
                    onMouseLeave={() => setHoveredDivisionId(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectDivision(div.id);
                      }
                    }}
                    className="cursor-pointer focus:outline-none"
                  >
                    <path
                      d={div.svgPath}
                      fill={getRegionFill(div)}
                      stroke={isSelected ? '#022c22' : isHovered ? '#065f46' : '#64748b'}
                      strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.25}
                      strokeLinejoin="round"
                      className="transition-colors duration-150"
                    />

                    {/* Division Label */}
                    <text
                      x={div.labelPos.x}
                      y={div.labelPos.y}
                      textAnchor="middle"
                      fill={getRegionTextFill(div)}
                      className="font-sans text-[13px] font-bold pointer-events-none"
                    >
                      {shortName}
                    </text>

                    {/* Zone Count Subtitle */}
                    <text
                      x={div.labelPos.x}
                      y={div.labelPos.y + 14}
                      textAnchor="middle"
                      fill={isSelected || isHovered ? '#d1fae5' : '#475569'}
                      className="font-mono text-[10px] font-semibold pointer-events-none"
                    >
                      {div.totalTaxZones} Zone{div.totalTaxZones > 1 ? 's' : ''}
                    </text>

                    {/* Regional Headquarters Pin */}
                    <circle
                      cx={div.pinPos.x}
                      cy={div.pinPos.y}
                      r={isSelected ? 7.5 : 5}
                      fill={isSelected ? '#fbbf24' : '#ffffff'}
                      stroke={isSelected ? '#022c22' : '#047857'}
                      strokeWidth={isSelected ? 2.5 : 1.75}
                      className="transition-all duration-150 pointer-events-none"
                    />
                    {isSelected && (
                      <circle
                        cx={div.pinPos.x}
                        cy={div.pinPos.y}
                        r={14}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth={1.75}
                        strokeOpacity={0.75}
                        className="pointer-events-none"
                      />
                    )}
                  </g>
                );
              })}

              {/* Bay of Bengal Label */}
              <text
                x="235"
                y="625"
                textAnchor="middle"
                fill="#0369a1"
                fillOpacity="0.65"
                className="font-sans text-[12px] font-semibold tracking-widest uppercase pointer-events-none"
              >
                Bay of Bengal
              </text>

              {/* Compact Compass Rose */}
              <g transform="translate(492, 62)" className="pointer-events-none">
                <circle
                  cx="0"
                  cy="0"
                  r="20"
                  fill="#ffffff"
                  fillOpacity="0.9"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
                <polygon points="0,-13 4,-2 -4,-2" fill="#047857" />
                <polygon points="0,13 4,2 -4,2" fill="#94a3b8" />
                <text
                  x="0"
                  y="-24"
                  textAnchor="middle"
                  fill="#334155"
                  className="font-mono text-[10px] font-bold"
                >
                  N
                </text>
              </g>
            </svg>
          </div>

          {/* Map Legend */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#047857] border border-[#022c22] shrink-0" />
              <span className="truncate">Active Selection</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#d1fae5] border border-slate-400 shrink-0" />
              <span className="truncate">Min Tax ৳5,000</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#e2f2eb] border border-slate-400 shrink-0" />
              <span className="truncate">Min Tax ৳4k/3k</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DCT Office Contact Information & Compliance Details */}
        <div className="lg:col-span-7 space-y-5">
          {/* Division Summary Banner */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="text-xs font-semibold text-emerald-800">
                  {selectedDivision.bnName}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-950 mt-1">
                  {selectedDivision.name}
                </h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  {selectedDivision.summary}
                </p>
              </div>
              <a
                href={buildAppointmentUrl({
                  service: `Regional Tax & DCT Assessment (${selectedDivision.name})`,
                  notes: `Selected zone: ${activeOffice.zoneName} (${activeOffice.eReturnZoneCode})`,
                  source: 'Bangladesh Tax Map Explorer',
                })}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-800 whitespace-nowrap shrink-0"
              >
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Book Regional Review</span>
              </a>
            </div>

            {/* 4-Metric Jurisdiction Snapshot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                <div className="text-[11px] font-medium text-slate-500">Regional HQ</div>
                <div className="text-xs font-bold text-slate-900 mt-1 leading-snug">
                  {selectedDivision.headquarters}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                <div className="text-[11px] font-medium text-slate-500">NBR Tax Zones</div>
                <div className="font-mono text-base font-bold tabular-nums text-slate-950 mt-1">
                  {selectedDivision.totalTaxZones} Zone
                  {selectedDivision.totalTaxZones > 1 ? 's' : ''}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                <div className="text-[11px] font-medium text-slate-500">Min Tax (Sec 163)</div>
                <div className="font-mono text-base font-bold tabular-nums text-emerald-800 mt-1">
                  ৳{selectedDivision.minimumTaxAmount.toLocaleString('en-IN')}+
                </div>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                <div className="text-[11px] font-medium text-slate-500">VAT Authority</div>
                <div className="text-xs font-semibold text-slate-800 mt-1 leading-snug line-clamp-2">
                  {selectedDivision.vatCommissionerate}
                </div>
              </div>
            </div>

            {/* Interactive Tab Switcher inside Inspector */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setActiveTab('offices')}
                className={`flex-1 min-w-[140px] px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'offices'
                    ? 'bg-white text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                DCT &amp; Tax Zone Contacts ({selectedDivision.offices.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('compliance')}
                className={`flex-1 min-w-[140px] px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'compliance'
                    ? 'bg-white text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Jurisdiction Compliance ({selectedDivision.complianceRequirements.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('matrix')}
                className={`flex-1 min-w-[140px] px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'matrix'
                    ? 'bg-white text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                All 8 Divisions Matrix
              </button>
            </div>
          </div>

          {/* TAB 1: DCT & TAX ZONE CONTACT DIRECTORY */}
          {activeTab === 'offices' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
              {/* Sub-zone office switcher if division has multiple key offices */}
              {selectedDivision.offices.length > 1 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600">
                    Select Tax Zone / Commissionerate Desk in {selectedDivision.name}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDivision.offices.map((office) => {
                      const isActive = office.id === activeOffice.id;
                      return (
                        <button
                          key={office.id}
                          type="button"
                          onClick={() => handleSelectOffice(selectedDivision.id, office.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                            isActive
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {office.zoneName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selected Office Header */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-emerald-800">
                        {activeOffice.eReturnZoneCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{activeOffice.commissionerTitle}</span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-950 mt-1">
                      {activeOffice.zoneName}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Primary Jurisdiction Focus: {activeOffice.focusSector}
                    </p>
                  </div>

                  <a
                    href={googleMapsOfficeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/40 transition-colors whitespace-nowrap shrink-0"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                    <span>Open Map Directions</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" aria-hidden="true" />
                  </a>
                </div>

                {/* Structured Contact Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <Building2 className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                      <span>Office Address</span>
                    </div>
                    <p className="text-sm text-slate-800 leading-relaxed">
                      {activeOffice.address}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                      <span>Taxpayer Service Hours</span>
                    </div>
                    <p className="text-sm font-medium text-slate-800">{activeOffice.officeHours}</p>
                    <p className="text-xs text-slate-500">Closed Friday, Saturday &amp; Govt Holidays</p>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                        <span>Commissionerate Telephone</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy('phone', activeOffice.phone)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:underline cursor-pointer"
                      >
                        {copiedField === 'phone' ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <a
                      href={`tel:${activeOffice.phone.replace(/[^+\d]/g, '')}`}
                      className="block font-mono text-sm font-bold tabular-nums text-slate-900 hover:text-emerald-700"
                    >
                      {activeOffice.phone}
                    </a>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <Mail className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                        <span>Official Zone Email</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy('email', activeOffice.email)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:underline cursor-pointer"
                      >
                        {copiedField === 'email' ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <a
                      href={`mailto:${activeOffice.email}`}
                      className="block font-mono text-sm font-bold text-slate-900 hover:text-emerald-700 break-all"
                    >
                      {activeOffice.email}
                    </a>
                  </div>
                </div>

                {/* DCT Circles & Area Coverage */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                      <span>Key DCT Assessment Circles</span>
                    </h5>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {activeOffice.dctCircles.map((circle) => (
                        <li
                          key={circle}
                          className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 border border-slate-200/70"
                        >
                          <ChevronRight className="w-3.5 h-3.5 text-emerald-700 mt-0.5 shrink-0" />
                          <span>{circle}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                      <span>Covered Thanas, Hubs &amp; Districts</span>
                    </h5>
                    <p className="text-xs text-slate-700 leading-relaxed rounded-lg bg-slate-50 px-3.5 py-3 border border-slate-200/70">
                      {activeOffice.coverageAreas.join(' · ')}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                      Note: Assessment jurisdiction follows your e-TIN registered circle or company
                      registered office under RJSC.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: JURISDICTION-SPECIFIC COMPLIANCE REQUIREMENTS */}
          {activeTab === 'compliance' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
              {/* Minimum Tax & e-Return Notice */}
              <div className="space-y-3 border-b border-slate-100 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-base font-bold text-slate-950 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                    <span>Regional Minimum Tax &amp; Statutory Rules</span>
                  </h4>
                  <span className="font-mono text-xs font-bold tabular-nums text-emerald-800">
                    {selectedDivision.minimumTaxLabel}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {selectedDivision.minimumTaxDetail}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                    <div className="text-xs font-bold text-slate-800">
                      Property Transfer AIT (Section 125)
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {selectedDivision.propertyAitNote}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                    <div className="text-xs font-bold text-slate-800">
                      Online e-Return Mandate
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {selectedDivision.eReturnStatus}
                    </p>
                  </div>
                </div>
              </div>

              {/* Regional Statutory Requirements */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-950">
                  Jurisdiction-Specific NBR Compliance Mandates ({selectedDivision.name})
                </h4>
                <div className="space-y-3">
                  {selectedDivision.complianceRequirements.map((rule) => (
                    <div
                      key={rule.title}
                      className="rounded-xl border border-slate-200/90 p-4 space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h5 className="text-sm font-bold text-slate-950">{rule.title}</h5>
                        <span className="font-mono text-[11px] text-emerald-800 font-semibold">
                          {rule.statutoryRef}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {rule.requirement}
                      </p>
                      <p className="text-[11px] text-slate-500 pt-1">
                        Applies to: {rule.applicability}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mandatory PSR Triggers */}
              <div className="space-y-2.5 border-t border-slate-100 pt-4">
                <h4 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                  <span>Key Regional PSR (Proof of Submission of Return) Triggers</span>
                </h4>
                <ul className="space-y-2">
                  {selectedDivision.psrMandates.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700"
                    >
                      <ShieldCheck
                        className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: ALL 8 DIVISIONS COMPARISON MATRIX */}
          {activeTab === 'matrix' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-950">
                  Bangladesh All-Division Minimum Tax &amp; Tax Zone Summary
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Click any division row below to inspect its DCT circles and jurisdiction compliance rules.
                </p>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <th className="py-2.5 px-3 font-bold">Division</th>
                      <th className="py-2.5 px-3 font-bold text-right">Tax Zones</th>
                      <th className="py-2.5 px-3 font-bold text-right">Metro Min Tax</th>
                      <th className="py-2.5 px-3 font-bold">Regional HQ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {BANGLADESH_TAX_JURISDICTIONS.map((div) => {
                      const active = div.id === selectedDivisionId;
                      return (
                        <tr
                          key={div.id}
                          onClick={() => {
                            handleSelectDivision(div.id);
                            setActiveTab('offices');
                          }}
                          className={`cursor-pointer transition-colors ${
                            active ? 'bg-emerald-50/70' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {div.name.replace(' Division', '')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                            {div.totalTaxZones}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-emerald-800">
                            ৳{div.minimumTaxAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{div.headquarters}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Connected Action Strip */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-900">
                Need DCT Hearing Representation or Circle Transfer?
              </p>
              <p className="text-xs text-slate-600">
                Our advocates handle notice replies (Sec 180/212), jurisdiction transfers, and e-Return audits nationwide.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link
                to="/tax-calculator"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                <span>Tax Calculator</span>
              </Link>
              <Link
                to="/contact?tab=appointment&area=Income%20Tax"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition-colors whitespace-nowrap"
              >
                <span>Consult Tax Counsel</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BangladeshTaxMapExplorer;
