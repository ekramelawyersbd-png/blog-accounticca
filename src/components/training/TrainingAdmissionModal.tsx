import React from 'react';
import { X } from 'lucide-react';
import AdmissionForm from './AdmissionForm';

export interface TrainingAdmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
  userEmail?: string | null;
  userName?: string | null;
}

export const TrainingAdmissionModal: React.FC<TrainingAdmissionModalProps> = ({
  isOpen,
  onClose,
  courseId,
  courseName,
  userEmail,
  userName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Close Button Header */}
        <div className="absolute top-4 right-4 z-10">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition shadow-xs cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <div className="overflow-y-auto p-1 sm:p-2">
          <AdmissionForm
            initialCourseId={courseId}
            initialCourseName={courseName}
            userEmail={userEmail}
            userName={userName}
            onSuccess={() => {
              // Stay visible so user sees the success step status indicator and can navigate to /student/dashboard or submit another
            }}
            className="border-0 shadow-none p-4 sm:p-6"
          />
        </div>
      </div>
    </div>
  );
};

export default TrainingAdmissionModal;
