import React from 'react';
import { 
  Star, 
  Sparkles, 
  CheckCircle2, 
  ThumbsUp, 
  MessageSquare, 
  Edit3, 
  Clock, 
  Award,
  ChevronRight
} from 'lucide-react';
import { Appointment, isAppointmentPast } from '../../services/appointmentService';

interface AppointmentRatingCardProps {
  booking: Appointment;
  onOpenRatingModal: (booking: Appointment) => void;
}

export function AppointmentRatingCard({
  booking,
  onOpenRatingModal
}: AppointmentRatingCardProps) {
  const isPast = isAppointmentPast(booking);
  const isCancelled = booking.status === 'Cancelled';
  const hasRating = !!booking.rating;

  // If appointment is cancelled, ratings are omitted
  if (isCancelled) {
    return null;
  }

  // If appointment date has NOT passed yet
  if (!isPast) {
    return (
      <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-200/60 flex items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            Post-appointment rating unlocks after session completion on{' '}
            <strong className="text-slate-700">{booking.date}</strong>.
          </span>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200/60 font-semibold text-slate-600">
          Upcoming
        </span>
      </div>
    );
  }

  // Appointment date HAS passed:
  // Case A: User has already submitted rating
  if (hasRating && booking.rating) {
    const r = booking.rating;
    return (
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/70 via-amber-50/40 to-slate-50 border border-amber-200/90 shadow-2xs space-y-3">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Your Consultation Rating</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  <span>Verified Review</span>
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Submitted on {new Date(r.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Stars */}
            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-amber-200/80 shadow-2xs">
              {[1, 2, 3, 4, 5].map((starIdx) => (
                <Star
                  key={starIdx}
                  className={`w-3.5 h-3.5 ${
                    starIdx <= r.rating 
                      ? 'fill-amber-400 text-amber-400' 
                      : 'fill-slate-100 text-slate-300'
                  }`}
                />
              ))}
              <span className="text-xs font-bold text-amber-900 ml-1 font-mono">{r.rating}.0</span>
            </div>

            <button
              type="button"
              onClick={() => onOpenRatingModal(booking)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:text-amber-950 bg-white hover:bg-amber-100/60 rounded-xl border border-amber-200 transition-colors cursor-pointer"
              title="Edit feedback"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit Review</span>
            </button>
          </div>
        </div>

        {/* Written Review Body */}
        {r.feedback && (
          <p className="text-xs sm:text-sm text-slate-700 bg-white/90 p-3 rounded-xl border border-amber-100 leading-relaxed italic">
            &ldquo;{r.feedback}&rdquo;
          </p>
        )}

        {/* Aspect Tags & Recommendation Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-600">
          <div className="flex flex-wrap items-center gap-2">
            {r.aspects?.expertise && (
              <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700">
                Depth: <strong className="font-bold text-amber-800">{r.aspects.expertise}/5</strong>
              </span>
            )}
            {r.aspects?.clarity && (
              <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700">
                Clarity: <strong className="font-bold text-amber-800">{r.aspects.clarity}/5</strong>
              </span>
            )}
            {r.aspects?.professionalism && (
              <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700">
                Professionalism: <strong className="font-bold text-amber-800">{r.aspects.professionalism}/5</strong>
              </span>
            )}
            {r.aspects?.responsiveness && (
              <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700">
                Value: <strong className="font-bold text-amber-800">{r.aspects.responsiveness}/5</strong>
              </span>
            )}
          </div>

          {r.recommend && (
            <div className="inline-flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/80">
              <ThumbsUp className="w-3 h-3 text-emerald-600" />
              <span>Recommended to Peers</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Case B: Appointment date has passed, but user has NOT rated yet!
  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-50/70 to-white border border-amber-300 shadow-2xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-900">
                Consultation Completed • Rate Your Experience
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                Feedback Open
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-relaxed">
              How was your advisory session with our Chartered Accountants &amp; High Court Advocates on {booking.date}?
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => onOpenRatingModal(booking)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Star className="w-3.5 h-3.5 fill-white text-white" />
          <span>Rate Consultation (1–5 Stars)</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Quick interactive star bar to prompt fast rating */}
      <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between gap-2 text-xs">
        <span className="text-slate-500 text-[11px]">Click a star to begin:</span>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((starVal) => (
            <button
              key={starVal}
              type="button"
              onClick={() => onOpenRatingModal(booking)}
              className="p-1 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer group"
              title={`Rate ${starVal} Stars`}
            >
              <Star className="w-4 h-4 fill-amber-200 text-amber-400 group-hover:fill-amber-400 group-hover:text-amber-500 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
