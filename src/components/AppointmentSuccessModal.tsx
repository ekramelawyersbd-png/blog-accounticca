import React, { useState } from 'react';
import { Calendar, Check, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { Modal } from './ui/Modal';

export interface AppointmentSuccessDetails {
  referenceId: string;
  practiceArea: string;
  expertiseArea?: string;
  partnerName: string;
  division?: string;
  date: string;
  timeSlot: string;
  mode: 'virtual' | 'in_person';
  clientName?: string;
  email: string;
  ccEmail?: string;
  googleCalendarUrl?: string;
}

export interface AppointmentSuccessModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback invoked when the user closes the modal */
  close: () => void;
  /** Callback invoked when the user triggers Google Calendar synchronization */
  syncToGoogle: () => void | Promise<void>;
  /** Submitted appointment details displayed in the confirmation summary */
  appointment: AppointmentSuccessDetails | null;
  /** Indicates whether the appointment has already been synced to Google Calendar */
  isCalendarSynced?: boolean;
  /** Optional modal heading override */
  title?: string;
  /** Optional CC address override (defaults to info@accounticca.com) */
  ccEmail?: string;
}

/**
 * Reusable post-submission appointment confirmation modal tailored to the Accounticca brand.
 * Accepts explicit `close` and `syncToGoogle` callbacks for clean integration across booking flows.
 */
export const AppointmentSuccessModal: React.FC<AppointmentSuccessModalProps> = ({
  isOpen,
  close,
  syncToGoogle,
  appointment,
  isCalendarSynced = false,
  title = 'Thank you for your appointment!',
  ccEmail = 'info@accounticca.com',
}) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const resolvedCcEmail = appointment?.ccEmail || ccEmail;

  const handleSyncClick = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await syncToGoogle();
    } finally {
      setIsSyncing(false);
    }
  };

  const calendarButtonContent = (
    <>
      {isSyncing ? (
        <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
      ) : isCalendarSynced ? (
        <Check className="w-4 h-4 shrink-0" />
      ) : (
        <Calendar className="w-4 h-4 shrink-0" />
      )}
      <span className="whitespace-nowrap">
        {isSyncing
          ? 'Syncing Calendar...'
          : isCalendarSynced
            ? 'Synced with Google Calendar'
            : 'Sync with Google Calendar'}
      </span>
      {appointment?.googleCalendarUrl && !isSyncing && (
        <ExternalLink className="w-3.5 h-3.5 opacity-85 shrink-0" />
      )}
    </>
  );

  const calendarButtonClassName =
    'flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors cursor-pointer';

  const footerContent = (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
      {appointment?.googleCalendarUrl ? (
        <a
          href={appointment.googleCalendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => void handleSyncClick()}
          className={calendarButtonClassName}
        >
          {calendarButtonContent}
        </a>
      ) : (
        <button
          type="button"
          onClick={() => void handleSyncClick()}
          disabled={isSyncing}
          className={`${calendarButtonClassName} disabled:opacity-70`}
        >
          {calendarButtonContent}
        </button>
      )}

      <button
        type="button"
        onClick={close}
        className="sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 px-5 py-3 text-sm font-semibold text-slate-800 transition-colors cursor-pointer"
      >
        Close
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={Boolean(isOpen && appointment)}
      onClose={close}
      size="md"
      titleId="accounticca-appointment-success-title"
      className="border-slate-200/90"
      icon={<CheckCircle2 className="w-7 h-7" />}
      eyebrow={
        appointment ? (
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs font-medium text-slate-600">
            <span className="font-semibold text-emerald-800">Accounticca</span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span>{appointment.division || 'Advisory & Legal Chambers'}</span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className="font-mono tabular-nums font-semibold text-slate-900">
              Ref {appointment.referenceId}
            </span>
          </div>
        ) : undefined
      }
      title={
        <span className="block [text-wrap:balance] text-slate-950">
          {title}
        </span>
      }
      description={
        appointment ? (
          <span>
            Your consultation with <strong className="font-semibold text-slate-900">{appointment.partnerName}</strong>{' '}
            is scheduled for{' '}
            <strong className="font-semibold text-slate-900 tabular-nums">{appointment.date}</strong> ({appointment.timeSlot}).{' '}
            A booking confirmation has been sent to{' '}
            <strong className="font-semibold text-slate-900">{appointment.email}</strong> with CC to{' '}
            <strong className="font-semibold text-emerald-800">{resolvedCcEmail}</strong>.
          </span>
        ) : undefined
      }
      footer={footerContent}
    >
      {appointment && (
        <dl className="divide-y divide-slate-200/80 border-y border-slate-200/80 text-xs sm:text-[13px] text-slate-700">
          <div className="py-2.5 flex items-baseline justify-between gap-4">
            <dt className="text-slate-500 font-medium shrink-0">Practice Area</dt>
            <dd className="font-semibold text-slate-900 text-right">{appointment.practiceArea}</dd>
          </div>
          {appointment.expertiseArea && (
            <div className="py-2.5 flex items-baseline justify-between gap-4">
              <dt className="text-slate-500 font-medium shrink-0">Focus Matter</dt>
              <dd className="font-medium text-slate-800 text-right">{appointment.expertiseArea}</dd>
            </div>
          )}
          <div className="py-2.5 flex items-baseline justify-between gap-4">
            <dt className="text-slate-500 font-medium shrink-0">Consultation Mode</dt>
            <dd className="font-semibold text-slate-900 text-right">
              {appointment.mode === 'virtual'
                ? 'Virtual (Google Meet)'
                : 'In-Person · Panthapath Chambers, Dhaka'}
            </dd>
          </div>
          <div className="py-2.5 flex items-baseline justify-between gap-4">
            <dt className="text-slate-500 font-medium shrink-0">Date &amp; Slot</dt>
            <dd className="font-semibold text-slate-900 text-right tabular-nums">
              {appointment.date} · {appointment.timeSlot}
            </dd>
          </div>
          <div className="py-2.5 flex items-baseline justify-between gap-4">
            <dt className="text-slate-500 font-medium shrink-0">Confirmation Copy</dt>
            <dd className="font-medium text-emerald-800 text-right break-all">
              {appointment.email} (CC: {resolvedCcEmail})
            </dd>
          </div>
        </dl>
      )}
    </Modal>
  );
};
