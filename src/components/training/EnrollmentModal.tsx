import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, CheckCircle2, ExternalLink, Calendar } from 'lucide-react';
import { redirectToAppointment, buildAppointmentUrl, APPOINTMENT_BASE_URL } from '../../utils/appointmentRedirect';
import { getAcademyCourseDashboardPath } from '../../utils/lmsPortalStore';

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  price: string;
}

export function EnrollmentModal({ isOpen, onClose, title, description, price }: EnrollmentModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false);
      setName('');
      setEmail('');
      setPhone('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const enrollment = {
      id: Date.now().toString(),
      title,
      name,
      email,
      phone,
      date: new Date().toISOString(),
    };

    try {
      const existing = localStorage.getItem('training_enrollments');
      const enrollments = existing ? JSON.parse(existing) : [];
      enrollments.push(enrollment);
      localStorage.setItem('training_enrollments', JSON.stringify(enrollments));
      setIsSubmitted(true);
    } catch (err) {
      console.error('Failed to save enrollment', err);
    }

    // Automatically redirect to centralized appointment portal in a new tab
    redirectToAppointment({
      name,
      email,
      phone,
      service: `Training & Legal Career: ${title}`,
      notes: `Course: ${title} (${price || 'Standard'}). Registrant: ${name}`,
      source: 'Course Enrollment Form'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Course Enrollment</h2>
            <Link 
              to={`/enrollment?course=${encodeURIComponent(title)}&price=${encodeURIComponent(price)}`}
              onClick={onClose}
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 mt-0.5"
            >
              <span>Open in Separate Page</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Enrollment Request Forwarded!</h3>
              <p className="text-slate-600 mb-6 text-sm">
                Your details for <strong className="text-slate-900">{title}</strong> were recorded and transferred to our appointment scheduling system.
              </p>
              <div className="space-y-3">
                <a
                  href={buildAppointmentUrl({
                    name,
                    email,
                    phone,
                    service: `Training & Legal Career: ${title}`,
                    notes: `Course: ${title} (${price || 'Standard'}). Registrant: ${name}`,
                    source: 'Course Enrollment Confirmation'
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2 text-sm"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Open Appointment Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <Link
                  to={getAcademyCourseDashboardPath(title)}
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <span>Open Student Dashboard</span>
                </Link>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Selected Course</p>
                <p className="font-bold text-slate-900">{title}</p>
                <p className="text-sm text-slate-600 mt-1 line-clamp-2">{description}</p>
                {price && (
                  <p className="text-emerald-700 font-medium mt-2 text-sm">{price}</p>
                )}
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="tel"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900"
                  placeholder="+880 1..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Confirm Enrollment
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
