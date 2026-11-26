import {
  ExternalLink,
  Lightbulb,
  Mail,
  MapPin,
  Phone,
  Scale,
  Shield,
  TrendingUp,
  X,
} from 'lucide-react';

const PARTNERSHIP_PILLARS = [
  {
    num: '01',
    line1: 'Business',
    line2: 'Strategy',
    icon: Lightbulb,
    iconClass: 'bg-amber-100 text-amber-600',
  },
  {
    num: '02',
    line1: 'Financial',
    line2: 'Intelligence',
    icon: TrendingUp,
    iconClass: 'bg-green-100 text-green-600',
  },
  {
    num: '03',
    line1: 'Legal',
    line2: 'Expertise',
    icon: Scale,
    iconClass: 'bg-sky-100 text-sky-600',
  },
  {
    num: '04',
    line1: 'Regulatory',
    line2: 'Compliance',
    icon: Shield,
    iconClass: 'bg-purple-100 text-purple-700',
  },
] as const;

/**
 * Persistent Accounticca × E-Lawyers Strategic Ecosystem Partnership banner
 * automatically rendered in the header slot of every blog post.
 */
export function BlogPartnershipBanner() {
  return (
    <div
      id="article-partnership-banner"
      className="w-full my-6 bg-white border border-slate-200 rounded-[20px] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] overflow-hidden text-slate-800 not-prose"
    >
      {/* Top Hero Section */}
      <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 text-center border-b border-slate-100">
        <div className="inline-block bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-[10px] font-bold tracking-[1px] text-slate-600 uppercase mb-4">
          Strategic Ecosystem Partnership
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-[34px] font-extrabold tracking-tight flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 mb-2 leading-tight">
          <span className="text-[#ea580c]">Accounticca</span>
          <span className="hidden sm:inline-flex items-center text-slate-300" aria-hidden="true">
            <X className="w-6 h-6 stroke-[2]" />
          </span>
          <span className="text-[#2563eb]">E-Lawyers</span>
        </h2>

        <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-3 text-balance">
          Building Stronger Businesses Through Integrated Advisory
        </h3>

        <p className="text-sm text-slate-600 leading-relaxed max-w-[700px] mx-auto">
          We bring together business advisory, financial intelligence, legal expertise, and
          regulatory compliance under one unified platform to protect your interests and scale your
          growth.
        </p>
      </div>

      {/* Four Strategic Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 px-5 sm:px-8 py-5 sm:py-6 bg-slate-50 border-b border-slate-100">
        {PARTNERSHIP_PILLARS.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div
              key={pillar.num}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3.5 sm:p-4 flex items-center justify-between gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${pillar.iconClass}`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <span className="text-[13px] font-semibold text-slate-800 leading-tight">
                  {pillar.line1}
                  <br />
                  {pillar.line2}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 font-mono tabular-nums shrink-0">
                {pillar.num}
              </span>
            </div>
          );
        })}
      </div>

      {/* Compact Contact Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 px-5 sm:px-8 py-5 sm:py-6 bg-white">
        {/* Address */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-medium text-slate-500 mb-1">Principal Chambers</h4>
            <p className="text-sm font-bold text-slate-900 leading-snug">
              BTI Centara Grand, Dhaka 1205
            </p>
            <a
              href="https://maps.google.com/?q=BTI+Centara+Grand,+Dhaka+1205"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-normal text-slate-500 hover:text-blue-600 transition-colors mt-1"
            >
              <span>Open in Google Maps</span>
              <ExternalLink className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-medium text-slate-500 mb-1">Direct Advisory Line</h4>
            <a
              href="tel:+8801335230170"
              className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors tabular-nums"
            >
              +880 1335-230170
            </a>
            <span className="block text-[11px] font-normal text-slate-500 mt-1">
              Sun-Thu, Corporate Consultations
            </span>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-medium text-slate-500 mb-1">Official Dispatch Desks</h4>
            <div className="flex flex-col gap-0.5">
              <a
                href="mailto:info@accounticca.com"
                className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors break-all"
              >
                info@accounticca.com
              </a>
              <a
                href="mailto:info@elawyersbd.com"
                className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors break-all"
              >
                info@elawyersbd.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
