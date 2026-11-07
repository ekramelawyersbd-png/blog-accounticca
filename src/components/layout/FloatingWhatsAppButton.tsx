import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  MessageCircle,
  X,
  Send,
  ShieldCheck,
  Clock,
  ExternalLink,
  Phone,
  Scale,
  Calculator,
  Building2,
  FileWarning
} from 'lucide-react';

const WHATSAPP_NUMBER = '8801335230170';
const DISPLAY_PHONE = '+880 1335-230170';

interface ExpertTopic {
  id: string;
  label: string;
  Practice: string;
  prefillText: string;
  icon: React.ComponentType<{ className?: string }>;
}

const EXPERT_TOPICS: ExpertTopic[] = [
  {
    id: 'income-tax',
    label: 'Income Tax Return & FA 2026 Assessment',
    Practice: 'ACCOUNTICCA Tax Desk',
    prefillText:
      'Hello ACCOUNTICCA × E-LAWYERS Team, I need live assistance regarding my Income Tax Return / Assessment for AY 2026–2027.',
    icon: Calculator
  },
  {
    id: 'corporate-rjsc',
    label: 'Corporate Law & RJSC Incorporation',
    Practice: 'E-LAWYERS Corporate Desk',
    prefillText:
      'Hello ACCOUNTICCA × E-LAWYERS Team, I would like to consult a legal expert regarding RJSC Company Incorporation & Corporate Compliance.',
    icon: Building2
  },
  {
    id: 'vat-tds',
    label: 'VAT (Mushak) & Withholding TDS Advisory',
    Practice: 'VAT & Audit Desk',
    prefillText:
      'Hello ACCOUNTICCA × E-LAWYERS Team, I need expert support regarding VAT Return (Mushak 9.1) and Withholding Tax (TDS) compliance.',
    icon: Scale
  },
  {
    id: 'nbr-notice',
    label: 'Urgent NBR Notice / Legal Hearing',
    Practice: 'Litigation & Tribunal Desk',
    prefillText:
      'Hello ACCOUNTICCA × E-LAWYERS Team, I have received an urgent NBR / Regulatory Notice and need immediate legal & tax representation.',
    icon: FileWarning
  }
];

export function FloatingWhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(EXPERT_TOPICS[0].id);
  const [customMessage, setCustomMessage] = useState<string>('');
  const location = useLocation();

  // On /contact page, FloatingLiveChat sits at bottom-right; offset our button to bottom-left or higher so they never collide
  const isContactPage = location.pathname.startsWith('/contact');

  const selectedTopic =
    EXPERT_TOPICS.find((t) => t.id === selectedTopicId) || EXPERT_TOPICS[0];

  const finalMessage = customMessage.trim()
    ? customMessage.trim()
    : selectedTopic.prefillText;

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    finalMessage
  )}`;

  return (
    <div
      className={`fixed z-40 print:hidden ${
        isContactPage
          ? 'bottom-20 lg:bottom-6 left-4 sm:left-6'
          : 'bottom-20 lg:bottom-6 right-4 sm:right-6'
      }`}
    >
      {/* Expandable WhatsApp Expert Support Card */}
      {isOpen && (
        <div
          id="floating-whatsapp-panel"
          className="mb-3 w-[calc(100vw-2rem)] sm:w-96 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          {/* Header */}
          <div className="bg-[#075E54] text-white p-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#25D366] text-slate-950 flex items-center justify-center shadow-sm shrink-0">
                <MessageCircle className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-white leading-tight">
                    WhatsApp Legal &amp; Tax Desk
                  </h4>
                  <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                </div>
                <p className="text-[11px] text-emerald-100 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>Live Advocates &amp; Tax Consultants • Replies in ~5m</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close WhatsApp support window"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4 bg-slate-50/70">
            <div className="bg-white p-3 rounded-xl border border-slate-200/90 text-xs text-slate-600 leading-relaxed shadow-2xs">
              <span className="font-bold text-slate-900 block mb-0.5">
                ACCOUNTICCA × E-LAWYERS Advisory
              </span>
              Select a compliance topic below or write your question to connect directly with a senior lawyer or tax advisor on WhatsApp.
            </div>

            {/* Topic Selector */}
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Select Advisory Desk
              </span>
              <div className="space-y-1.5">
                {EXPERT_TOPICS.map((topic) => {
                  const Icon = topic.icon;
                  const isSelected = topic.id === selectedTopicId && !customMessage.trim();
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => {
                        setSelectedTopicId(topic.id);
                        setCustomMessage('');
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-2xs'
                          : 'bg-white border-slate-200/90 text-slate-700 hover:border-slate-300 font-medium'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isSelected ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{topic.label}</span>
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                        {topic.Practice.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Message Input */}
            <div>
              <label
                htmlFor="whatsapp-custom-msg"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5"
              >
                Or Custom Inquiry (Optional)
              </label>
              <textarea
                id="whatsapp-custom-msg"
                rows={2}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Type your specific legal, tax, VAT, or RJSC question..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* Primary CTA Link to WhatsApp */}
            <div className="pt-1 flex flex-col gap-2">
              <a
                id="launch-whatsapp-chat-btn"
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs shadow-md transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Start Live WhatsApp Chat</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-75" />
              </a>

              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1">
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Confidential Client Privilege</span>
                </span>
                <a
                  href={`tel:+${WHATSAPP_NUMBER}`}
                  className="inline-flex items-center gap-1 font-mono font-semibold text-slate-600 hover:text-emerald-700"
                >
                  <Phone className="w-3 h-3" />
                  <span>{DISPLAY_PHONE}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating WhatsApp Trigger Button */}
      <div className="flex items-center justify-end">
        <button
          id="floating-whatsapp-trigger-btn"
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="group relative inline-flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-extrabold p-3.5 sm:px-4 sm:py-3 rounded-2xl shadow-xl hover:shadow-2xl border border-emerald-400/50 transition-all duration-200 cursor-pointer"
          aria-label="Chat with Legal and Tax Experts on WhatsApp"
          aria-expanded={isOpen}
        >
          {/* Online Indicator Ping */}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white border-2 border-[#075E54]" />
            </span>
          )}

          <div className="w-6 h-6 rounded-lg bg-slate-950/10 flex items-center justify-center shrink-0">
            {isOpen ? (
              <X className="w-4 h-4 text-slate-950" />
            ) : (
              <MessageCircle className="w-4 h-4 text-slate-950 fill-current" />
            )}
          </div>

          <div className="hidden sm:flex flex-col items-start text-left leading-none pr-0.5">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-900/80">
              Live Expert Support
            </span>
            <span className="text-xs font-black text-slate-950 mt-0.5">
              {isOpen ? 'Close WhatsApp' : 'WhatsApp Chat'}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
