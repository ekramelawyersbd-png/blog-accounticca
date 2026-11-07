import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Phone, 
  Calendar, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  Minimize2, 
  Maximize2,
  Building2,
  Clock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { APPOINTMENT_BASE_URL } from '../utils/appointmentRedirect';

interface Message {
  id: string;
  sender: 'support' | 'user';
  text: string;
  time: string;
  actions?: {
    label: string;
    href: string;
    type: 'appointment' | 'call' | 'link';
  }[];
}

const QUICK_INQUIRIES = [
  '💼 Corporate Law & RJSC Compliance',
  '📈 Tax, VAT & Statutory Audit',
  '⚡ Urgent NBR Assessment Notice',
  '💵 Retainer Proposal & Fee Structure',
  '📅 Schedule Partner Appointment',
];

export function FloatingLiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'support',
      text: 'Welcome to ACCOUNTICCA × E-LAWYERS Real-Time Business Support. Our senior advisory desk is currently active. How can our joint legal and financial teams assist your venture today?',
      time: 'Just now',
      actions: [
        {
          label: 'Book Direct Appointment',
          href: APPOINTMENT_BASE_URL,
          type: 'appointment'
        },
        {
          label: 'Call Direct Hunting Desk',
          href: 'tel:+8801335230170',
          type: 'call'
        }
      ]
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      scrollToBottom();
    }
  }, [isOpen, messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsTyping(true);

    // Simulated intelligent assistant responses tailored to legal & tax domains
    setTimeout(() => {
      let replyText = 'Thank you for reaching out. We have registered your inquiry with our senior advisory desk.';
      let actions: Message['actions'] = [
        {
          label: 'Reserve Calendar Consultation',
          href: APPOINTMENT_BASE_URL,
          type: 'appointment'
        },
        {
          label: 'Call Hotline (+880 1335-230170)',
          href: 'tel:+8801335230170',
          type: 'call'
        }
      ];

      const lower = text.toLowerCase();
      if (lower.includes('tax') || lower.includes('vat') || lower.includes('nbr') || lower.includes('audit')) {
        replyText = 'For Tax & VAT queries (TIN, return submissions, VAT BIN, withholding tax, or audit compliance), our ACCOUNTICCA chartered advisors can review your records and provide immediate optimization.';
      } else if (lower.includes('law') || lower.includes('rjsc') || lower.includes('company') || lower.includes('incorporat')) {
        replyText = 'For Corporate Law, RJSC Company Incorporation, MoA/AoA drafting, or corporate secretarial compliance, our E-LAWYERS advocates and barristers are ready to assist.';
      } else if (lower.includes('notice') || lower.includes('urgent') || lower.includes('tribunal') || lower.includes('court')) {
        replyText = '⚡ Urgent matters (NBR show-cause notices or legal deadlines) require swift statutory action to preserve appeal rights. Please call our direct desk immediately or email the notice to info@accounticca.com.';
        actions = [
          {
            label: 'Call Emergency Desk Now',
            href: 'tel:+8801335230170',
            type: 'call'
          },
          {
            label: 'Open Appointment Calendar',
            href: APPOINTMENT_BASE_URL,
            type: 'appointment'
          }
        ];
      } else if (lower.includes('fee') || lower.includes('cost') || lower.includes('price') || lower.includes('retainer')) {
        replyText = 'We provide transparent milestone-based fees for statutory filings and customized monthly retainer packages for ongoing corporate secretarial, tax, and legal advisory.';
      } else if (lower.includes('appointment') || lower.includes('schedule') || lower.includes('meet') || lower.includes('visit')) {
        replyText = 'You can book an immediate in-person session at our Panthapath executive chambers (BTI Centara Grand) or a virtual conference via Google Meet / Zoom.';
      }

      setMessages(prev => [
        ...prev,
        {
          id: `support-${Date.now()}`,
          sender: 'support',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actions
        }
      ]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Live Chat Window */}
      {isOpen && (
        <div className="w-[calc(100vw-32px)] sm:w-[380px] h-[520px] max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col mb-4 animate-in slide-in-from-bottom-5 fade-in-50 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-4 flex items-center justify-between border-b border-emerald-900/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-white shadow-xs">
                  <Building2 className="w-5 h-5 text-emerald-100" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold tracking-tight text-white">
                    Executive Advisory Desk
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-emerald-300/80 font-medium">
                  ACCOUNTICCA × E-LAWYERS
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Close live chat"
              aria-label="Close live chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60 text-xs">
            <div className="text-center my-1">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-200/70 text-slate-600">
                Official Business Support • Confidential
              </span>
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-emerald-700 text-white rounded-br-xs shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-2xs'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>

                {/* Optional Action Buttons attached to message */}
                {msg.actions && (
                  <div className="mt-2 space-y-1.5 w-full max-w-[85%]">
                    {msg.actions.map((action, i) => (
                      <a
                        key={i}
                        href={action.href}
                        target={action.type === 'appointment' ? '_blank' : undefined}
                        rel={action.type === 'appointment' ? 'noopener noreferrer' : undefined}
                        className="inline-flex items-center justify-between w-full p-2 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-800 hover:text-emerald-800 font-bold text-[11px] transition-all shadow-2xs group"
                      >
                        <span className="flex items-center gap-1.5">
                          {action.type === 'appointment' && <Calendar className="w-3.5 h-3.5 text-emerald-600" />}
                          {action.type === 'call' && <Phone className="w-3.5 h-3.5 text-emerald-600" />}
                          <span>{action.label}</span>
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    ))}
                  </div>
                )}

                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {msg.time}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 rounded-2xl px-3 py-2 w-16 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-1.5">
            {QUICK_INQUIRIES.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 font-medium transition-colors shrink-0 cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              inputMode="text"
              name="chat-message"
              autoComplete="off"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about corporate law, tax, or fees..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white transition-colors cursor-pointer shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Footer Hotline Subtext */}
          <div className="bg-slate-900 px-3 py-1.5 text-center text-[10px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <ShieldCheck className="w-3 h-3" />
              End-to-End Confidential
            </span>
            <a href="tel:+8801335230170" className="hover:text-white font-mono">
              Hotline: +880 1335-230170
            </a>
          </div>
        </div>
      )}

      {/* Floating Action Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative group inline-flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-xl hover:shadow-emerald-600/30 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
        aria-label="Toggle Live Business Support Chat"
      >
        {/* Animated pulse rings */}
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 animate-ping opacity-75 pointer-events-none" />
        
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-black text-[11px] flex items-center justify-center border-2 border-white shadow-xs">
            {unreadCount}
          </span>
        )}

        <div className="relative flex items-center justify-center">
          {isOpen ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <MessageSquare className="w-5 h-5 text-white" />
          )}
        </div>

        <span className="hidden sm:inline text-xs font-black tracking-wide pr-1">
          {isOpen ? 'Close Live Chat' : 'Live Business Support'}
        </span>
      </button>
    </div>
  );
}
