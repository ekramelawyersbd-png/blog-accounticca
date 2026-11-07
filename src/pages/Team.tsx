import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { teamMembers, TeamMember } from '../data/teamData';
import { Breadcrumbs } from '../components/Breadcrumbs';
import {
  Linkedin,
  Facebook,
  Youtube,
  MessageCircle,
  Mail,
  Phone,
  Calendar,
  ExternalLink,
  Search,
  X,
  Copy,
  Check,
  ArrowRight,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { buildAppointmentUrl, APPOINTMENT_BASE_URL } from '../utils/appointmentRedirect';
import { SEO } from '../components/SEO';

type DepartmentFilter = 'all' | 'leadership' | 'partners' | 'advisors' | 'operations';

function getMemberDepartment(member: TeamMember): DepartmentFilter {
  const pos = member.position.toLowerCase();
  if (pos.includes('founding') || pos.includes('ceo')) {
    return 'leadership';
  }
  if (pos.includes('partner') || pos.includes('senior consultant')) {
    return 'partners';
  }
  if (
    pos.includes('consultant') ||
    pos.includes('advocate') ||
    pos.includes('adviser')
  ) {
    return 'advisors';
  }
  return 'operations';
}

function formatCleanPhone(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/\s+/g, ' ').trim();
}

export function Team() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDepartment, setActiveDepartment] = useState<DepartmentFilter>('all');
  const [selectedExpertise, setSelectedExpertise] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [expandedMemberNames, setExpandedMemberNames] = useState<Record<string, boolean>>({});
  const [hoveredMemberName, setHoveredMemberName] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const expertiseTopics = useMemo(() => {
    const topics = new Set<string>();
    teamMembers.forEach((m) => {
      m.expertise.split(',').forEach((part) => {
        const trimmed = part.trim();
        if (trimmed) topics.add(trimmed);
      });
    });
    return Array.from(topics);
  }, []);

  const departmentCounts = useMemo(() => {
    const counts: Record<DepartmentFilter, number> = {
      all: teamMembers.length,
      leadership: 0,
      partners: 0,
      advisors: 0,
      operations: 0,
    };
    teamMembers.forEach((m) => {
      counts[getMemberDepartment(m)] += 1;
    });
    return counts;
  }, []);

  const filteredMembers = useMemo(() => {
    return teamMembers.filter((member) => {
      const matchesDepartment =
        activeDepartment === 'all' || getMemberDepartment(member) === activeDepartment;

      const matchesExpertise =
        selectedExpertise === 'all' ||
        member.expertise.toLowerCase().includes(selectedExpertise.toLowerCase());

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        member.name.toLowerCase().includes(q) ||
        member.position.toLowerCase().includes(q) ||
        member.expertise.toLowerCase().includes(q) ||
        member.bio.toLowerCase().includes(q);

      return matchesDepartment && matchesExpertise && matchesSearch;
    });
  }, [activeDepartment, selectedExpertise, searchQuery]);

  const toggleCardExpanded = (name: string) => {
    setExpandedMemberNames((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => {
      setCopiedField((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setActiveDepartment('all');
    setSelectedExpertise('all');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <SEO
        title={
          selectedMember
            ? `${selectedMember.name} – ${selectedMember.position} | E-Lawyers & Accounticca`
            : 'Our Advocates, Tax Consultants & Advisory Team | E-Lawyers & Accounticca'
        }
        description={
          selectedMember
            ? selectedMember.bio
            : 'Meet our multidisciplinary team of Supreme Court Advocates, ACCA Chartered Certified Accountants, Income Tax Practitioners, and RJSC Corporate Advisors.'
        }
        canonicalUrl="/team"
        type={selectedMember ? 'profile' : 'website'}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Our Team', url: '/team' }
        ]}
      />
      <Breadcrumbs items={[{ label: 'Our Team' }]} />

      {/* 1. Header & Interactive Directory Controls (div:nth-of-type(1)) */}
      <div className="mb-10">
        <section className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-xs">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-wide text-emerald-700 mb-2">
              E-Lawyers & Accounticca · Multidisciplinary Advisory Practice
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.5rem] font-bold text-slate-900 tracking-tight leading-tight mb-4">
              Our Professional Team
            </h1>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-6">
              Meet the dedicated advocates, ACCA-qualified accountants, tax practitioners, and corporate compliance specialists committed to guiding businesses and individuals across Bangladesh. Hover over or click any advisor card to reveal their full professional biography and LinkedIn profile.
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-500 mb-7 pb-6 border-b border-slate-100">
              <span className="font-semibold text-slate-800">{teamMembers.length} Advisory Professionals</span>
              <span aria-hidden="true">·</span>
              <span>Corporate & Commercial Law</span>
              <span aria-hidden="true">·</span>
              <span>NBR Income Tax & VAT</span>
              <span aria-hidden="true">·</span>
              <span>ACCA Audit & Financial Reporting</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={APPOINTMENT_BASE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-xs transition-all"
              >
                <Calendar className="w-4 h-4 text-emerald-100" />
                <span>Book Consultation with Legal & Tax Team</span>
                <ExternalLink className="w-4 h-4 text-emerald-200" />
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-semibold text-sm px-5 py-3 rounded-xl transition-colors"
              >
                <span>Submit Case Brief</span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </Link>
            </div>
          </div>

          {/* Search & Department Filter Bar */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Segmented Department Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              {(
                [
                  { id: 'all', label: `All Team (${departmentCounts.all})` },
                  { id: 'leadership', label: `Founding & CEO (${departmentCounts.leadership})` },
                  { id: 'partners', label: `Partners & Senior (${departmentCounts.partners})` },
                  { id: 'advisors', label: `Tax, VAT & Legal (${departmentCounts.advisors})` },
                  { id: 'operations', label: `Compliance & Ops (${departmentCounts.operations})` },
                ] as { id: DepartmentFilter; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveDepartment(tab.id)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeDepartment === tab.id
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search & Practice Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <label className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, role, or expertise..."
                  aria-label="Search team members"
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </label>

              <select
                value={selectedExpertise}
                onChange={(e) => setSelectedExpertise(e.target.value)}
                aria-label="Filter by practice area"
                className="py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors cursor-pointer"
              >
                <option value="all">All Practice Areas</option>
                {expertiseTopics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(activeDepartment !== 'all' || selectedExpertise !== 'all' || searchQuery.trim() !== '') && (
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing <strong className="text-slate-800">{filteredMembers.length}</strong> of {teamMembers.length} professionals
              </span>
              <button
                type="button"
                onClick={resetFilters}
                className="text-emerald-700 hover:text-emerald-800 font-semibold underline underline-offset-2 cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          )}
        </section>
      </div>

      {/* 2. Interactive Team Member Grid (div:nth-of-type(2)) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 items-start">
        {filteredMembers.map((member, idx) => {
          const expertiseList = member.expertise
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

          const isPinned = !!expandedMemberNames[member.name];
          const isHovered = hoveredMemberName === member.name;
          const isRevealed = isPinned || isHovered;

          return (
            <div
              key={member.name + idx}
              onMouseEnter={() => setHoveredMemberName(member.name)}
              onMouseLeave={() => setHoveredMemberName((prev) => (prev === member.name ? null : prev))}
              onClick={() => toggleCardExpanded(member.name)}
              role="button"
              tabIndex={0}
              aria-expanded={isRevealed}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleCardExpanded(member.name);
                }
              }}
              className={`group bg-white rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                isRevealed
                  ? 'border-emerald-600/60 shadow-lg ring-1 ring-emerald-600/20'
                  : 'border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-600/40'
              }`}
            >
              {/* Card Top Identity Block (div:nth-of-type(1) > div:nth-of-type(1) > img:nth-of-type(1)) */}
              <div className="p-6 flex flex-col items-center border-b border-slate-100 bg-gradient-to-b from-slate-50/90 to-white relative">
                <div
                  className={`w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-sm ring-1 mb-4 bg-slate-100 transition-all duration-300 ${
                    isRevealed ? 'ring-emerald-500/50 scale-105' : 'ring-slate-200/80'
                  }`}
                >
                  <img
                    src={member.imgSrc}
                    alt={member.name}
                    loading="lazy"
                    className="w-full h-full object-cover object-top transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        member.name
                      )}&background=047857&color=fff&size=200`;
                    }}
                  />
                </div>
                <h3 className="text-lg font-bold text-slate-900 text-center leading-snug">
                  {member.name}
                </h3>
                <p className="text-emerald-700 font-semibold text-sm text-center mt-0.5 mb-2">
                  {member.position}
                </p>
                <div className="text-xs text-slate-500 text-center flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5">
                  {expertiseList.map((exp, i) => (
                    <span key={exp} className="inline-flex items-center gap-1.5">
                      {i > 0 && <span aria-hidden="true">·</span>}
                      <span>{exp}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Interactive Biography & LinkedIn Reveal Body */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-medium text-slate-500">
                    {isRevealed ? 'Full Professional Biography' : 'Biography Summary'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    {isPinned ? (
                      <>
                        <span>Pinned Open</span>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : isHovered ? (
                      <>
                        <span>Click to Pin</span>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <span>Hover or Click</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </span>
                </div>

                {/* Biography Text: Clamped in default state, fully revealed on hover or click */}
                <p
                  className={`text-sm text-slate-600 leading-relaxed transition-all duration-300 ${
                    isRevealed ? 'line-clamp-none text-slate-700 mb-4' : 'line-clamp-3 mb-3'
                  }`}
                >
                  {member.bio}
                </p>

                {/* Revealed Interactive Section: Prominent LinkedIn CTA + Direct Contact Details */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isRevealed
                      ? 'max-h-80 opacity-100 mb-4 pt-3 border-t border-emerald-100'
                      : 'max-h-0 opacity-0 pointer-events-none'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full mb-3 py-2.5 px-4 bg-[#0077b5] hover:bg-[#006097] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <Linkedin className="w-4 h-4" />
                      <span>Connect on LinkedIn</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>
                  )}

                  <div className="flex flex-col gap-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                    {member.email && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400">Email:</span>
                        <a
                          href={`mailto:${member.email}`}
                          className="font-medium text-slate-800 hover:text-emerald-700 truncate"
                        >
                          {member.email}
                        </a>
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400">Phone:</span>
                        <a
                          href={`tel:${member.phone.replace(/\s+/g, '')}`}
                          className="font-medium text-slate-800 hover:text-emerald-700 tabular-nums"
                        >
                          {formatCleanPhone(member.phone)}
                        </a>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedMember(member)}
                    className="mt-2.5 w-full text-center text-xs font-semibold text-emerald-700 hover:text-emerald-800 py-1.5 inline-flex items-center justify-center gap-1 hover:underline underline-offset-2 cursor-pointer"
                  >
                    <span>Open Full Credential Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick Social & Contact Bar */}
                <div
                  className="flex flex-wrap items-center justify-center gap-2.5 mt-auto pt-3 border-t border-slate-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-2 rounded-lg transition-colors ${
                        isRevealed
                          ? 'bg-[#0077b5] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-[#0077b5] hover:text-white'
                      }`}
                      title="LinkedIn Profile"
                      aria-label={`${member.name} on LinkedIn`}
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {member.facebook && (
                    <a
                      href={member.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-slate-100 text-slate-600 hover:bg-[#1877f2] hover:text-white rounded-lg transition-colors"
                      title="Facebook"
                      aria-label={`${member.name} on Facebook`}
                    >
                      <Facebook className="w-4 h-4" />
                    </a>
                  )}
                  {member.youtube && (
                    <a
                      href={member.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-slate-100 text-slate-600 hover:bg-[#ff0000] hover:text-white rounded-lg transition-colors"
                      title="YouTube"
                      aria-label={`${member.name} on YouTube`}
                    >
                      <Youtube className="w-4 h-4" />
                    </a>
                  )}
                  {member.whatsapp && (
                    <a
                      href={buildAppointmentUrl({
                        lawyer: member.name,
                        service: member.position,
                        source: 'Team WhatsApp Inquiry',
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-slate-100 text-slate-600 hover:bg-[#25d366] hover:text-white rounded-lg transition-colors"
                      title={`Request WhatsApp consultation with ${member.name}`}
                      aria-label={`Request WhatsApp consultation with ${member.name}`}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  )}
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="p-2 bg-slate-100 text-slate-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors"
                      title={`Email ${member.name} (${member.email})`}
                      aria-label={`Email ${member.name}`}
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                  {member.phone && (
                    <a
                      href={`tel:${member.phone.replace(/\s+/g, '')}`}
                      className="p-2 bg-slate-100 text-slate-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors"
                      title={`Call ${member.name} (${formatCleanPhone(member.phone)})`}
                      aria-label={`Call ${member.name}`}
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Primary Consultation CTA */}
                <div
                  className="mt-4 pt-3 border-t border-slate-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <a
                    href={buildAppointmentUrl({
                      lawyer: member.name,
                      service: member.position,
                      source: 'Team Member Card',
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center py-2.5 px-4 bg-emerald-50 hover:bg-emerald-700 text-emerald-800 hover:text-white font-semibold text-xs rounded-xl border border-emerald-200 hover:border-emerald-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book Consultation</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty Search State */}
      {filteredMembers.length === 0 && (
        <section className="text-center py-14 bg-white rounded-2xl border border-slate-200 mt-4 px-6">
          <p className="text-base font-semibold text-slate-800 mb-1">
            No team members match your current filter criteria
          </p>
          <p className="text-sm text-slate-500 mb-5">
            Try clearing your search query or switching back to all departments.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-xl hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            Show All Team Members
          </button>
        </section>
      )}

      {/* 3. Multidisciplinary Advisory Pods Section (<section> to preserve div:nth-of-type indices) */}
      <section className="mt-16 pt-12 border-t border-slate-200">
        <div className="max-w-2xl mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            How Our Advisory Pods Collaborate
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Every client engagement is supported by a coordinated team combining legal advocacy, statutory tax planning, and certified accounting oversight.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <article className="bg-white p-6 rounded-2xl border border-slate-200/90">
            <p className="text-xs font-semibold text-emerald-700 mb-1">01. Corporate & Legal</p>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Company Formation, RJSC & Commercial Vetting
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Led by Founding Advocates and Senior Legal Consultants, handling Memorandum & Articles drafting, RJSC statutory returns, share transfers, and commercial dispute resolution.
            </p>
          </article>

          <article className="bg-white p-6 rounded-2xl border border-slate-200/90">
            <p className="text-xs font-semibold text-emerald-700 mb-1">02. Direct & Indirect Taxation</p>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Income Tax, Mushak VAT & Tribunal Representation
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Dedicated Income Tax Advisers and VAT Consultants managing corporate and individual tax filings, withholding tax (TDS/VDS) audits, and representation before NBR appellate authorities.
            </p>
          </article>

          <article className="bg-white p-6 rounded-2xl border border-slate-200/90">
            <p className="text-xs font-semibold text-emerald-700 mb-1">03. Financial Assurance</p>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              ACCA Financial Reporting & Compliance Systems
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Chartered Certified Accountants (ACCA) and financial consultants structuring IFRS-compliant financial statements, internal audit controls, and DVC-verified statutory reporting.
            </p>
          </article>
        </div>
      </section>

      {/* 4. Member Full Profile Modal */}
      {selectedMember && (
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="member-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setSelectedMember(null)}
        >
          <article
            className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 sm:p-7 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/70">
              <div className="flex items-center gap-4">
                <img
                  src={selectedMember.imgSrc}
                  alt={selectedMember.name}
                  className="w-20 h-20 rounded-full object-cover object-top border-2 border-white shadow-sm bg-white shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      selectedMember.name
                    )}&background=047857&color=fff&size=200`;
                  }}
                />
                <div>
                  <h2 id="member-modal-title" className="text-xl font-bold text-slate-900">
                    {selectedMember.name}
                  </h2>
                  <p className="text-sm font-semibold text-emerald-700 mt-0.5">
                    {selectedMember.position}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{selectedMember.expertise}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                aria-label="Close profile modal"
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-7 space-y-5">
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Professional Biography
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">{selectedMember.bio}</p>
              </div>

              {(selectedMember.email || selectedMember.phone) && (
                <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedMember.email && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="min-w-0 pr-2">
                        <p className="text-[11px] text-slate-400 font-medium">Direct Email</p>
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {selectedMember.email}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedMember.email!, 'email')}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-white transition-colors shrink-0 cursor-pointer"
                        title="Copy email address"
                      >
                        {copiedField === 'email' ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}

                  {selectedMember.phone && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="min-w-0 pr-2">
                        <p className="text-[11px] text-slate-400 font-medium">Direct Phone</p>
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {formatCleanPhone(selectedMember.phone)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(formatCleanPhone(selectedMember.phone), 'phone')
                        }
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-white transition-colors shrink-0 cursor-pointer"
                        title="Copy phone number"
                      >
                        {copiedField === 'phone' ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                {selectedMember.linkedin && (
                  <a
                    href={selectedMember.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0077b5] hover:bg-[#006097] text-white text-xs font-semibold transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    <span>Connect on LinkedIn</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>
                )}

                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedMember(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <a
                    href={buildAppointmentUrl({
                      lawyer: selectedMember.name,
                      service: selectedMember.position,
                      source: 'Team Profile Modal',
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Book Consultation</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>
                </div>
              </div>
            </div>
          </article>
        </section>
      )}
    </div>
  );
}
