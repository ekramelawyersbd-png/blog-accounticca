import React, { useState } from 'react';
import { 
  Star, 
  Sparkles, 
  CheckCircle2, 
  ThumbsUp, 
  MessageSquare, 
  ShieldCheck, 
  X, 
  Award,
  Building2,
  Calendar,
  Clock,
  Send
} from 'lucide-react';
import { 
  Appointment, 
  AppointmentRating, 
  submitAppointmentRating 
} from '../../services/appointmentService';

interface AppointmentRatingModalProps {
  booking: Appointment;
  userId: string;
  onClose: () => void;
  onRatingSubmitted: (updatedBooking: Appointment) => void;
}

const RATING_LABELS: Record<number, { title: string; desc: string }> = {
  1: { title: 'Needs Improvement', desc: 'Consultation did not meet expected advisory standards.' },
  2: { title: 'Fair Experience', desc: 'Basic counsel provided, but key questions remained unaddressed.' },
  3: { title: 'Good Consultation', desc: 'Satisfactory counsel; covered fundamental statutory points.' },
  4: { title: 'Very Good & Comprehensive', desc: 'Clear, well-structured legal or tax insights provided.' },
  5: { title: 'Exceptional Advisory', desc: 'Elite partner-level depth, clear strategy, and immediate actionable value.' }
};

const SUGGESTION_TAGS = [
  'Clear statutory guidance',
  'Actionable tax planning',
  'Prompt High Court counsel',
  'Helped avert regulatory penalty',
  'Exceptional documentation review',
  'Punctual & highly professional'
];

export function AppointmentRatingModal({
  booking,
  userId,
  onClose,
  onRatingSubmitted
}: AppointmentRatingModalProps) {
  const existingRating = booking.rating;

  const [rating, setRating] = useState<number>(existingRating?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>(existingRating?.feedback || '');
  const [recommend, setRecommend] = useState<boolean>(existingRating?.recommend ?? true);
  
  // Specific aspects (1-5)
  const [aspectExpertise, setAspectExpertise] = useState<number>(existingRating?.aspects?.expertise || 5);
  const [aspectClarity, setAspectClarity] = useState<number>(existingRating?.aspects?.clarity || 5);
  const [aspectProfessionalism, setAspectProfessionalism] = useState<number>(existingRating?.aspects?.professionalism || 5);
  const [aspectValue, setAspectValue] = useState<number>(existingRating?.aspects?.responsiveness || 5);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeRatingScore = hoverRating !== null ? hoverRating : rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || rating < 1) {
      setErrorMsg('Please select an overall rating star score.');
      return;
    }
    if (!feedback.trim()) {
      setErrorMsg('Please provide brief feedback to help us refine our advisory consultations.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: Omit<AppointmentRating, 'submittedAt'> & { submittedAt?: string } = {
        rating,
        feedback: feedback.trim(),
        aspects: {
          expertise: aspectExpertise,
          clarity: aspectClarity,
          professionalism: aspectProfessionalism,
          responsiveness: aspectValue
        },
        recommend,
        submittedAt: existingRating?.submittedAt || new Date().toISOString()
      };

      const savedRating = await submitAppointmentRating(
        booking.id,
        booking.referenceId,
        payload,
        userId
      );

      const updatedBooking: Appointment = {
        ...booking,
        rating: savedRating
      };

      onRatingSubmitted(updatedBooking);
      onClose();
    } catch (err) {
      console.error('Error submitting consultation rating:', err);
      setErrorMsg('Could not save rating. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = (tag: string) => {
    if (!feedback.includes(tag)) {
      setFeedback(prev => (prev.trim() ? `${prev.trim()}. ${tag}` : tag));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl space-y-5 my-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {existingRating ? 'Update Consultation Review' : 'Rate Consultation Experience'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Verified Client
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Docket <span className="font-mono text-amber-300">{booking.referenceId}</span> • {booking.practiceArea}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="px-5 sm:px-6 space-y-5 flex-1 overflow-y-auto">
          {/* Appointment Context Summary */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>{booking.date} ({booking.timeSlot})</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>{booking.division || 'Accounticca Advisory'}</span>
            </div>
          </div>

          {/* Primary Star Score */}
          <div className="text-center p-5 rounded-2xl bg-gradient-to-b from-amber-50/60 to-white border border-amber-200/70 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Overall Consultation Quality
            </div>

            {/* Stars */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isFilled = starValue <= activeRatingScore;
                return (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 sm:p-1.5 rounded-xl transition-all transform hover:scale-110 active:scale-95 cursor-pointer focus:outline-none"
                    aria-label={`Rate ${starValue} of 5 stars`}
                  >
                    <Star
                      className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${
                        isFilled 
                          ? 'fill-amber-400 text-amber-500 drop-shadow-xs' 
                          : 'fill-slate-100 text-slate-300 hover:text-amber-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Label for current score */}
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-slate-900">
                {RATING_LABELS[activeRatingScore]?.title || 'Select Rating'}
              </div>
              <div className="text-xs text-slate-500 max-w-sm mx-auto">
                {RATING_LABELS[activeRatingScore]?.desc}
              </div>
            </div>
          </div>

          {/* Detailed Aspect Ratings (Pills / Radios) */}
          <div className="space-y-3 pt-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Counsel Aspects Evaluation</span>
              <span className="text-[11px] text-slate-400 normal-case font-normal">(1 = Low, 5 = Exceptional)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Aspect 1: Expertise */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">Legal &amp; Tax Depth</span>
                  <span className="font-bold text-amber-700 font-mono">{aspectExpertise}/5</span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAspectExpertise(val)}
                      className={`flex-1 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                        aspectExpertise === val 
                          ? 'bg-amber-500 text-white border-amber-600 shadow-2xs' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect 2: Clarity */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">Clarity &amp; Strategy</span>
                  <span className="font-bold text-amber-700 font-mono">{aspectClarity}/5</span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAspectClarity(val)}
                      className={`flex-1 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                        aspectClarity === val 
                          ? 'bg-amber-500 text-white border-amber-600 shadow-2xs' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect 3: Professionalism */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">Chamber Professionalism</span>
                  <span className="font-bold text-amber-700 font-mono">{aspectProfessionalism}/5</span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAspectProfessionalism(val)}
                      className={`flex-1 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                        aspectProfessionalism === val 
                          ? 'bg-amber-500 text-white border-amber-600 shadow-2xs' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect 4: Actionability */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">Actionable Practical Value</span>
                  <span className="font-bold text-amber-700 font-mono">{aspectValue}/5</span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAspectValue(val)}
                      className={`flex-1 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                        aspectValue === val 
                          ? 'bg-amber-500 text-white border-amber-600 shadow-2xs' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Written Feedback Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="consultation-feedback" className="block text-xs font-bold text-slate-800">
                Qualitative Consultation Review &amp; Experience
              </label>
              <span className="text-[11px] text-slate-400">
                {feedback.length} characters
              </span>
            </div>
            
            <textarea
              id="consultation-feedback"
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share details of the counsel provided, partner engagement, documentation clarity, and overall chamber experience..."
              className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all leading-relaxed"
              required
            />

            {/* Quick Tag Suggestions */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Quick impressions (click to insert):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTION_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-600 border border-slate-200/80 transition-colors cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Peer Recommendation Checkbox */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={recommend}
              onChange={(e) => setRecommend(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Recommend to corporate peers</span>
              </span>
              <p className="text-slate-500 mt-0.5 text-[11px]">
                I would recommend Accounticca Advisory &amp; E-Lawyers Chambers to fellow corporate directors, tax managers, and business owners.
              </p>
            </div>
          </label>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Footer Controls */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting Review...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{existingRating ? 'Save Updated Review' : 'Submit Consultation Review'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
