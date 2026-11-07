import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  FileCheck2
} from 'lucide-react';
import { LmsCourse } from '../../data/lmsCoursesData';
import { useLms, LmsCertificateRecord } from '../../contexts/LmsContext';

interface FinalExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: LmsCourse;
  onOpenCertificate?: (cert: LmsCertificateRecord) => void;
}

export const FinalExamModal: React.FC<FinalExamModalProps> = ({
  isOpen,
  onClose,
  course,
  onOpenCertificate
}) => {
  const { submitFinalExam, getFinalExamResult, studentProfile } = useLms();
  const exam = course.finalExam;

  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(() =>
    new Array(exam.questions.length).fill(-1)
  );
  const [secondsLeft, setSecondsLeft] = useState<number>(exam.timeLimitMinutes * 60);
  const [submissionResult, setSubmissionResult] = useState<{
    scorePercent: number;
    passed: boolean;
    certificate: LmsCertificateRecord | null;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedAnswers(new Array(exam.questions.length).fill(-1));
      setSecondsLeft(exam.timeLimitMinutes * 60);
      setSubmissionResult(null);
      setErrorMsg(null);
    }
  }, [isOpen, exam.questions.length, exam.timeLimitMinutes]);

  useEffect(() => {
    if (!isOpen || submissionResult !== null) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, submissionResult]);

  if (!isOpen) return null;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSubmitExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAnswers.some((a) => a === -1)) {
      setErrorMsg('Please answer all examination questions before submitting.');
      return;
    }
    setErrorMsg(null);
    const timeSpent = Math.max(10, exam.timeLimitMinutes * 60 - secondsLeft);
    const res = submitFinalExam(course.courseId, selectedAnswers, timeSpent);
    setSubmissionResult({
      scorePercent: res.scorePercent,
      passed: res.passed,
      certificate: res.certificate
    });
  };

  const previousBest = getFinalExamResult(course.courseId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div>
            <div className="text-xs font-medium text-emerald-400">
              Final Certification Assessment · Candidate: {studentProfile.fullName} ({studentProfile.studentId})
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {exam.title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center gap-1.5 text-xs font-mono tabular-nums text-emerald-400">
              <Clock className="w-4 h-4" />
              <span>{formatTimer(secondsLeft)}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 shrink-0">
          <div>
            <span>Total Questions: <strong>{exam.questions.length}</strong></span>
            <span className="mx-2">·</span>
            <span>Passing Criterion: <strong>{exam.passingScore}%</strong></span>
            <span className="mx-2">·</span>
            <span>Duration: <strong>{exam.timeLimitMinutes} Minutes</strong></span>
          </div>
          {previousBest && (
            <div className="font-mono tabular-nums text-slate-700">
              Recorded Score: <strong>{previousBest.scorePercent}%</strong> ({previousBest.passed ? 'PASSED' : 'NOT PASSED'})
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {submissionResult && (
            <div
              className={`p-5 rounded-2xl border ${
                submissionResult.passed
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              } space-y-3`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {submissionResult.passed ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-7 h-7 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <h3 className="text-base font-bold">
                      {submissionResult.passed
                        ? 'Final Examination Passed — Certificate Unlocked!'
                        : 'Minimum Passing Score Not Reached'}
                    </h3>
                    <p className="text-xs opacity-90">
                      Your Score: <strong className="font-mono tabular-nums">{submissionResult.scorePercent}%</strong> (Required Passing Score: {exam.passingScore}%)
                    </p>
                  </div>
                </div>

                {submissionResult.passed && submissionResult.certificate && onOpenCertificate && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCertificate(submissionResult.certificate!);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Award className="w-4 h-4" />
                    <span>View & Download Certificate</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <form id="final-exam-form" onSubmit={handleSubmitExam} className="space-y-5">
            {exam.questions.map((q, qIdx) => (
              <div
                key={q.id}
                className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3"
              >
                <div className="text-sm font-bold text-slate-900">
                  Question {qIdx + 1} of {exam.questions.length}: {q.question}
                </div>

                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[qIdx] === optIdx;
                    const isEvaluated = submissionResult !== null;
                    const isCorrect = optIdx === q.correctOptionIndex;

                    return (
                      <label
                        key={optIdx}
                        className={`flex items-start gap-3 p-3 rounded-xl border text-xs sm:text-sm cursor-pointer transition-colors ${
                          isEvaluated && isCorrect
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold'
                            : isEvaluated && isSelected && !isCorrect
                            ? 'bg-rose-50 border-rose-300 text-rose-900'
                            : isSelected
                            ? 'bg-slate-900 text-white border-slate-900 font-medium'
                            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`final_q_${q.id}`}
                          checked={isSelected}
                          onChange={() => {
                            if (submissionResult !== null) return;
                            const next = [...selectedAnswers];
                            next[qIdx] = optIdx;
                            setSelectedAnswers(next);
                          }}
                          className="mt-0.5"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>

                {submissionResult && (
                  <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                    <strong className="text-slate-900">Statutory Explanation:</strong>{' '}
                    {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Answered: {selectedAnswers.filter((a) => a !== -1).length} of {exam.questions.length}</span>
          </div>

          <div className="flex items-center gap-3">
            {submissionResult && !submissionResult.passed && (
              <button
                type="button"
                onClick={() => {
                  setSelectedAnswers(new Array(exam.questions.length).fill(-1));
                  setSubmissionResult(null);
                  setSecondsLeft(exam.timeLimitMinutes * 60);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Final Examination</span>
              </button>
            )}

            {!submissionResult ? (
              <button
                type="submit"
                form="final-exam-form"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Submit Final Examination</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                Close Assessment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
