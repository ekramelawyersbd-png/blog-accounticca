import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  ExternalLink, 
  Copy, 
  Check, 
  Calendar,
  ArrowRight
} from 'lucide-react';
import { APPOINTMENT_BASE_URL } from '../utils/appointmentRedirect';

export function ContactELawyers() {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const googleMapsUrl = 'https://www.google.com/maps/dir/?api=1&destination=BTI+Centara+Grand+144+Green+Road+Panthapath+Dhaka+1205';

  const handleCopyPhone = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('+8801335230170');
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handleCopyEmail = (emailText: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(emailText);
      setCopiedEmail(emailText);
      setTimeout(() => setCopiedEmail(null), 2000);
    }
  };

  return (
    <section className="my-10 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white border border-slate-800 shadow-xl relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

      <div className="relative z-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">
              Integrated Advisory Practice
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 flex-wrap">
              <span>ACCOUNTICCA</span>
              <span className="text-emerald-400 font-light">×</span>
              <span>E-LAWYERS</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Accounting • Tax • VAT • Audit • Corporate &amp; Legal Compliance
            </p>
          </div>

          <a
            href={APPOINTMENT_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-emerald-500/20 transition-all self-start sm:self-auto shrink-0 group"
          >
            <Calendar className="w-4 h-4 text-emerald-200" />
            <span>Book Consultation</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>

        {/* Contact & Location Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          {/* Office Address */}
          <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/60 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Office Location</span>
              </div>
              <p className="text-slate-200 font-medium leading-relaxed">
                G-5, BTI Centara Grand, 144 Green Road, Panthapath, Dhaka–1205
              </p>
            </div>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold pt-1"
            >
              <span>Get Directions</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Telephone */}
          <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/60 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center gap-2 text-teal-300 font-bold mb-1">
                <Phone className="w-3.5 h-3.5" />
                <span>Call Us</span>
              </div>
              <div className="flex items-center justify-between">
                <a
                  href="tel:+8801335230170"
                  className="text-sm font-bold text-white hover:text-emerald-300 font-mono"
                >
                  +88 01335-230170–81
                </a>
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  title="Copy telephone"
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                >
                  {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Direct client support &amp; consultation desk
              </p>
            </div>
            <a
              href="tel:+8801335230170"
              className="inline-flex items-center gap-1 text-[11px] text-teal-300 hover:text-teal-200 font-semibold pt-1"
            >
              <span>Call Now</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          {/* Email Desks */}
          <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/60 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center gap-2 text-blue-300 font-bold mb-1">
                <Mail className="w-3.5 h-3.5" />
                <span>Email Enquiries</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <a href="mailto:info@accounticca.com" className="text-slate-200 hover:text-emerald-300 font-mono text-[11px]">
                    info@accounticca.com
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyEmail('info@accounticca.com')}
                    className="p-0.5 text-slate-400 hover:text-white"
                  >
                    {copiedEmail === 'info@accounticca.com' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <a href="mailto:info@elawyersbd.com" className="text-slate-200 hover:text-teal-300 font-mono text-[11px]">
                    info@elawyersbd.com
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyEmail('info@elawyersbd.com')}
                    className="p-0.5 text-slate-400 hover:text-white"
                  >
                    {copiedEmail === 'info@elawyersbd.com' ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
            <a
              href="mailto:info@accounticca.com?cc=info@elawyersbd.com"
              className="inline-flex items-center gap-1 text-[11px] text-blue-300 hover:text-blue-200 font-semibold pt-1"
            >
              <span>Send Message</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>

        </div>

        {/* Portals footer strip */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <a
              href="https://accounticca.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-emerald-400 font-medium transition-colors"
            >
              accounticca.com ↗
            </a>
            <span>•</span>
            <a
              href="https://elawyersbd.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-teal-300 font-medium transition-colors"
            >
              elawyersbd.com ↗
            </a>
          </div>

          <span className="text-[11px] text-slate-500">
            Supreme Court &amp; RJSC Chambers, Dhaka
          </span>
        </div>

      </div>
    </section>
  );
}
