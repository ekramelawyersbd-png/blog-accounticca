import { useState } from 'react';
import { X, Calendar, Clock, ExternalLink, ShieldCheck, ArrowRight } from 'lucide-react';
import { Expert } from '../../data/communityData';
import { redirectToAppointment, APPOINTMENT_BASE_URL } from '../../utils/appointmentRedirect';

interface BookConsultationModalProps {
  expert: Expert | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BookConsultationModal({
  expert,
  isOpen,
  onClose
}: BookConsultationModalProps) {
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('11:00 AM - 12:00 PM');
  const [topic, setTopic] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  if (!isOpen || !expert) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    redirectToAppointment({
      name: clientName,
      email: clientEmail,
      phone: clientPhone,
      date,
      time: timeSlot,
      notes: topic,
      lawyer: expert.name,
      service: expert.role,
      source: 'Expert Consultation Modal'
    });
    onClose();
  };

  const handleDirectBooking = () => {
    redirectToAppointment({
      lawyer: expert.name,
      service: expert.role,
      source: 'Direct Expert Booking'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={expert.avatar} 
              alt={expert.name} 
              className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-100"
            />
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Schedule Consultation</h3>
              <p className="text-xs text-emerald-700 font-semibold">{expert.name} • {expert.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Standard Advisory:</span>
            </div>
            <span className="font-extrabold text-emerald-800 text-sm">{expert.hourlyRate || 'BDT 4,000 / hr'}</span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Inquiries with <strong>{expert.name}</strong> are processed directly through our centralized advisory desk. Any details entered below will be forwarded automatically.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Preferred Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Preferred Time Slot
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                >
                  <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                  <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
                  <option value="03:00 PM - 04:00 PM">03:00 PM - 04:00 PM</option>
                  <option value="05:00 PM - 06:00 PM">05:00 PM - 06:00 PM</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Consultation Topic / Legal Brief
            </label>
            <textarea
              rows={2}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Briefly state your requirements (e.g. VAT notice resolution, corporate registration, tax advice)..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                id="consultation-name"
                autoComplete="name"
                inputMode="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Tanvir Ahmed"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Phone / WhatsApp
              </label>
              <input
                type="tel"
                name="tel"
                id="consultation-phone"
                autoComplete="tel"
                inputMode="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="+880 1712-345678"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              id="consultation-email"
              autoComplete="email"
              inputMode="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="tanvir@company.com.bd"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
            />
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDirectBooking}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline inline-flex items-center gap-1 py-1"
            >
              <span>Skip form & contact desk directly</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Submit Inquiry</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
