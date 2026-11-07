import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  Search, 
  X, 
  HelpCircle, 
  Sparkles, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  Scale, 
  FileText, 
  CreditCard, 
  Building2, 
  ShieldCheck, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { APPOINTMENT_BASE_URL } from '../utils/appointmentRedirect';

export interface ContactFAQItem {
  id: string;
  category: 'consultation' | 'retainer' | 'fees' | 'statutory';
  categoryLabel: string;
  question: string;
  answer: string;
  keyPoints?: string[];
  actionLink?: {
    label: string;
    href: string;
    isExternal?: boolean;
    type?: 'call' | 'appointment' | 'link';
  };
}

export const CONTACT_FAQS: ContactFAQItem[] = [
  {
    id: 'how-dual-consultation-works',
    category: 'consultation',
    categoryLabel: 'Consultation',
    question: 'How does an integrated consultation work between ACCOUNTICCA and E-LAWYERS?',
    answer: 'Our strategic ecosystem operates as a unified advisory single window. When you schedule a consultation, your matter is triaged by both senior legal advocates and chartered tax advisors. Depending on your needs, your session will include representation from both disciplines—ensuring contracts are legally bulletproof while simultaneously optimized for NBR tax, VAT, and corporate withholding compliance.',
    keyPoints: [
      'Single joint intake briefing without repeating information',
      'Dual review by corporate lawyers and chartered tax specialists',
      'Preventive compliance checking prior to signing commercial agreements'
    ],
    actionLink: {
      label: 'Book Joint Consultation',
      href: APPOINTMENT_BASE_URL,
      isExternal: true,
      type: 'appointment'
    }
  },
  {
    id: 'response-time-and-urgency',
    category: 'consultation',
    categoryLabel: 'Consultation',
    question: 'How quickly can I expect a response or confirmation after submitting an inquiry?',
    answer: 'All electronic inquiries submitted via our contact forms or direct email desks are acknowledged immediately and assigned to a practice lead within 2 to 4 business hours. For scheduled appointments via our booking engine, confirmation is instant with automated calendar invitations. If your matter is time-sensitive (such as an NBR show-cause notice deadline or urgent High Court filing), we advise calling our direct hunting desk immediately.',
    keyPoints: [
      'Guaranteed 24-hour formal response window for online briefs',
      'Instant direct inquiry routing to senior practice leads',
      'Urgent hotline support via +880 1335-230170 (Lines 70–81)'
    ],
    actionLink: {
      label: 'Call Direct Hunting Desk',
      href: 'tel:+8801335230170',
      type: 'call'
    }
  },
  {
    id: 'single-retainer-ecosystem',
    category: 'retainer',
    categoryLabel: 'Retainer & Scope',
    question: 'Can our company engage both firms under a single corporate retainer agreement?',
    answer: 'Yes. One of the principal advantages of our partnership is the Single Retainer Ecosystem. Rather than managing separate law chambers, tax consultants, and bookkeeping agencies with conflicting counsel, your company enters a single Master Services Agreement (MSA) covering ongoing RJSC corporate secretarial services, day-to-day contract vetting, monthly VAT returns, and quarterly tax withholding oversight.',
    keyPoints: [
      'Unified billing and consolidated retainer invoice',
      'Dedicated partner point-of-contact across all matters',
      'Eliminates friction between corporate lawyers and financial controllers'
    ]
  },
  {
    id: 'in-person-office-visit',
    category: 'consultation',
    categoryLabel: 'Consultation',
    question: 'Can I visit your office in person, and do I need to book in advance?',
    answer: 'Clients are welcome to meet our partners at our Panthapath executive chambers (Suite G-5, BTI Centara Grand, 144–144/1 Green Road, Panthapath, Dhaka–1205). While our reception is open Sunday to Thursday (9:30 AM to 6:30 PM), we strongly recommend reserving an appointment in advance so the relevant practice partner and briefing materials are prepared for your arrival.',
    keyPoints: [
      'Centrally located at Panthapath near Green Road junction',
      'Dedicated client parking and secure executive meeting facilities',
      'Virtual conference options (Google Meet / Zoom) available for remote or overseas clients'
    ],
    actionLink: {
      label: 'Get Google Maps Directions',
      href: 'https://www.google.com/maps/search/?api=1&query=BTI+Centara+Grand+144+Green+Road+Panthapath+Dhaka+1205',
      isExternal: true,
      type: 'link'
    }
  },
  {
    id: 'documents-to-bring',
    category: 'consultation',
    categoryLabel: 'Consultation',
    question: 'What documents or information should I prepare before our introductory session?',
    answer: 'To maximize the productivity of your initial advisory session, having core entity documents on hand is recommended: (1) For corporate structuring: Certificate of Incorporation, Form XII, MoA/AoA, and Trade License; (2) For tax & VAT queries: e-TIN, 13-digit BIN, latest income tax acknowledgement receipt, or copies of NBR notices/orders; (3) For commercial transactions: draft contracts, MoUs, or term sheets.',
    keyPoints: [
      'Digital copies can be uploaded during the appointment booking process',
      'All shared documentation is protected under strict legal privilege and NDA',
      'Informal advisory is available if documents are currently pending retrieval'
    ]
  },
  {
    id: 'fee-structure-and-transparency',
    category: 'fees',
    categoryLabel: 'Fees & Billing',
    question: 'How are professional fees structured for advisory, litigation, and statutory filings?',
    answer: 'We uphold absolute fee transparency with zero hidden disbursements: (1) Standard Incorporations & Statutory Filings are priced on fixed, milestone-based fees; (2) Retainer Partnerships are structured on transparent monthly or quarterly tiers tailored to your transaction volume; (3) Complex Litigation, High Court writs, or NBR Appellate Tribunal defense are quoted with structured matter-based retainers and clear appearance stages.',
    keyPoints: [
      'Detailed written engagement proposals issued prior to commencement',
      'Statutory government treasury fees and professional charges itemized separately',
      'Corporate bank transfer, RTGS/BEFTN, and e-invoicing supported'
    ]
  },
  {
    id: 'foreign-investment-bida-support',
    category: 'statutory',
    categoryLabel: 'Statutory & FDI',
    question: 'Do you assist foreign investors and multinational corporations with BIDA and FDI approvals?',
    answer: 'Extensively. Our foreign investment desk provides end-to-end facilitation for international investors setting up in Bangladesh. This includes 100% foreign-owned subsidiary incorporation, branch or liaison office permissions from Bangladesh Investment Development Authority (BIDA), inward remittance encashment certificates, outward dividend repatriation clearance with Bangladesh Bank, and expatriate work permits (E-visa).',
    keyPoints: [
      'Liaison, Branch, and Private Limited company options evaluated for tax efficiency',
      'Double Taxation Avoidance Agreement (DTAA) optimization',
      'Statutory compliance coordination with BIDA, RJSC, and Central Bank'
    ]
  },
  {
    id: 'tax-notice-and-tribunal-defense',
    category: 'statutory',
    categoryLabel: 'Statutory & FDI',
    question: 'What should we do if we receive an urgent tax demand or assessment notice from NBR?',
    answer: 'Do not ignore statutory deadlines. The Income Tax Act 2023 imposes strict limitation periods for filing objections, appeals, and revision applications before the Commissioner (Appeals) or the Taxes Appellate Tribunal. Forward a scanned copy of the assessment order or show-cause notice to info@accounticca.com or bring it to our direct desk immediately so our advocates and tax partners can draft a formal stay application or legal reply.',
    keyPoints: [
      'Immediate calculation of statutory appeal deadlines and stay requirements',
      'Harmonized defense reconciling financial books with statutory legal grounds',
      'Direct representation before Assessment Circles, Appeal Commissioners, and Tribunals'
    ],
    actionLink: {
      label: 'Email Urgent Notice to Advisory Desk',
      href: 'mailto:info@accounticca.com?cc=info@elawyersbd.com&subject=URGENT:%20NBR%20Notice%20Defense%20Request',
      type: 'link'
    }
  }
];

export function ContactFaq() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(['how-dual-consultation-works', 'response-time-and-urgency']));

  const toggleAccordion = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setOpenIds(new Set(CONTACT_FAQS.map(faq => faq.id)));
  };

  const collapseAll = () => {
    setOpenIds(new Set());
  };

  const filteredFaqs = useMemo(() => {
    return CONTACT_FAQS.filter(faq => {
      const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        faq.question.toLowerCase().includes(q) || 
        faq.answer.toLowerCase().includes(q) ||
        (faq.keyPoints && faq.keyPoints.some(k => k.toLowerCase().includes(q)));
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const categories = [
    { id: 'all', label: 'All Queries' },
    { id: 'consultation', label: 'Consultations & Desk' },
    { id: 'retainer', label: 'Dual Retainers' },
    { id: 'fees', label: 'Fees & Billing' },
    { id: 'statutory', label: 'Tax, RJSC & BIDA' },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="service-faq">
      <div className="bg-white rounded-3xl p-6 sm:p-10 lg:p-12 border border-slate-200/90 shadow-sm relative overflow-hidden">
        {/* Decorative corner glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-8 relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Client Clarifications &amp; Guidance</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Frequently Asked Service Questions
          </h2>
          
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            Quickly resolve common inquiries regarding our dual-firm engagement model, booking turnaround, fee structures, and in-person chamber meetings.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="max-w-4xl mx-auto mb-8 relative z-10 space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords (e.g., Retainer, Fees, NBR notice, Panthapath office, BIDA)..."
              className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl pl-12 pr-10 py-3.5 text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Tabs & Expand Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 self-end sm:self-auto">
              <span>{filteredFaqs.length} {filteredFaqs.length === 1 ? 'question' : 'questions'}</span>
              <span>•</span>
              <button
                onClick={expandAll}
                className="text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
              >
                Expand all
              </button>
              <span>•</span>
              <button
                onClick={collapseAll}
                className="text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
              >
                Collapse
              </button>
            </div>
          </div>
        </div>

        {/* Accordion List */}
        <div className="max-w-4xl mx-auto space-y-3.5 relative z-10">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = openIds.has(faq.id);
              return (
                <div
                  key={faq.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen 
                      ? 'bg-slate-50/80 border-emerald-300 shadow-sm ring-1 ring-emerald-400/20' 
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/40'
                  }`}
                >
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    aria-expanded={isOpen}
                    className="w-full text-left p-5 sm:p-6 flex items-start justify-between gap-4 cursor-pointer focus:outline-none"
                  >
                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                          {faq.categoryLabel}
                        </span>
                      </div>
                      <h3 className={`text-base sm:text-lg font-bold transition-colors ${
                        isOpen ? 'text-emerald-950' : 'text-slate-900'
                      }`}>
                        {faq.question}
                      </h3>
                    </div>

                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'bg-emerald-700 text-white rotate-180' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {/* Accordion Content */}
                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 pt-1 text-slate-700 border-t border-slate-200/60 text-sm leading-relaxed space-y-4 animate-in fade-in-50 duration-200">
                      <p className="font-normal text-slate-700 text-sm sm:text-base">
                        {faq.answer}
                      </p>

                      {faq.keyPoints && faq.keyPoints.length > 0 && (
                        <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 space-y-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                            Key Takeaways:
                          </span>
                          <ul className="space-y-1.5">
                            {faq.keyPoints.map((point, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {faq.actionLink && (
                        <div className="pt-1">
                          <a
                            href={faq.actionLink.href}
                            target={faq.actionLink.isExternal ? '_blank' : undefined}
                            rel={faq.actionLink.isExternal ? 'noopener noreferrer' : undefined}
                            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-100/70 hover:bg-emerald-200/80 px-4 py-2 rounded-xl transition-colors group"
                          >
                            {faq.actionLink.type === 'call' && <Phone className="w-3.5 h-3.5 text-emerald-700" />}
                            {faq.actionLink.type === 'appointment' && <Calendar className="w-3.5 h-3.5 text-emerald-700" />}
                            {faq.actionLink.type === 'link' && <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />}
                            <span>{faq.actionLink.label}</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 border border-slate-200">
              <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 mb-1">
                No matching queries found
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-4">
                We couldn't find any questions matching "{searchQuery}". Try modifying your search keywords or reach out directly.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
              >
                Clear search and view all FAQs
              </button>
            </div>
          )}
        </div>

        {/* Bottom Fast-Track Advisory Card */}
        <div className="max-w-4xl mx-auto mt-10 p-5 sm:p-6 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800 shadow-md">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-base font-bold text-white flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Have a specific case or confidential inquiry?</span>
            </h4>
            <p className="text-xs text-slate-300">
              Our direct intake line connects directly to corporate, tax, and audit secretariats.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <a
              href="tel:+8801335230170"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>+880 1335-230170</span>
            </a>
            <a
              href={APPOINTMENT_BASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-200" />
              <span>Book Appointment</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
