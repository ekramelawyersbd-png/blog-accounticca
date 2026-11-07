import React, { useState } from 'react';
import { Award, CheckCircle2, XCircle, RotateCcw, HelpCircle, ArrowRight, Sparkles } from 'lucide-react';
import { glossaryQuizQuestions } from '../../data/glossaryData';
import { CorporateComplianceMasteryQuiz } from '../tax/CorporateComplianceMasteryQuiz';

export const GlossaryQuiz: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQ = glossaryQuizQuestions[currentIdx];

  const handleSelect = (idx: number) => {
    if (hasAnswered) return;
    setSelectedOption(idx);
    setHasAnswered(true);
    if (idx === currentQ.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < glossaryQuizQuestions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
      setHasAnswered(false);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setHasAnswered(false);
    setScore(0);
    setIsCompleted(false);
  };

  return (
    <div className="space-y-10 my-10">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Interactive Knowledge Check</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Bangladesh Tax &amp; VAT Knowledge Quiz
            </h3>
            <p className="text-slate-600 text-sm mt-0.5">
              Test your grasp of the 2.5% corporate banking rule, Section 56/56Ka 50% penalties, Startup Sandbox (9-Yr &amp; 0% tax), TDS, VAT, and the Sixth Schedule.
            </p>
          </div>

          {!isCompleted && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Question</span>
              <span className="text-sm font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {currentIdx + 1} of {glossaryQuizQuestions.length}
              </span>
            </div>
          )}
        </div>

        {!isCompleted ? (
          <div>
            {/* Question Text */}
            <div className="mb-5">
              <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {currentQ.question}
              </h4>
              <p className="text-sm font-medium text-emerald-800 mt-1.5 font-bengali">
                {currentQ.bengaliQuestion}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {currentQ.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correctAnswer;

                let btnClass = 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800';
                if (hasAnswered) {
                  if (isCorrect) {
                    btnClass = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-2 ring-emerald-400';
                  } else if (isSelected) {
                    btnClass = 'border-red-500 bg-red-50 text-red-900 font-semibold ring-2 ring-red-400';
                  } else {
                    btnClass = 'border-slate-200 bg-slate-50 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    disabled={hasAnswered}
                    className={`w-full text-left p-4 rounded-2xl border text-sm transition-all duration-150 flex items-center justify-between gap-3 ${btnClass}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="leading-snug">{option}</span>
                    </div>

                    {hasAnswered && (
                      <div className="shrink-0">
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : isSelected ? (
                          <XCircle className="w-5 h-5 text-red-600" />
                        ) : null}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation Box */}
            {hasAnswered && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-6 text-sm">
                <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-emerald-600" />
                  Statutory Explanation:
                </div>
                <p className="text-slate-700 leading-relaxed mb-2">
                  {currentQ.explanation}
                </p>
                <div className="text-xs text-slate-500 font-semibold">
                  Reference: <span className="text-slate-800">{currentQ.statutoryReference}</span>
                </div>
              </div>
            )}

            {/* Footer Next Button */}
            {hasAnswered && (
              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow transition-all inline-flex items-center gap-2"
                >
                  <span>{currentIdx < glossaryQuizQuestions.length - 1 ? 'Next Question' : 'View Quiz Result'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Completed Screen */
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-4">
              <Award className="w-8 h-8" />
            </div>
            <h4 className="text-2xl font-bold text-slate-900 mb-2">
              Quiz Completed!
            </h4>
            <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
              You scored <strong className="text-emerald-700 text-lg">{score}</strong> out of{' '}
              <strong className="text-slate-900 text-lg">{glossaryQuizQuestions.length}</strong>!
            </p>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 max-w-md mx-auto mb-6 text-xs sm:text-sm text-emerald-900 text-left">
              {score === glossaryQuizQuestions.length ? (
                <p>🎯 <strong>Exceptional!</strong> You have a masterful understanding of Bangladesh’s Income Tax Act 2023, VAT Act 2012, and Finance Act 2026 compliance rules!</p>
              ) : score >= Math.ceil(glossaryQuizQuestions.length * 0.6) ? (
                <p>👍 <strong>Great Job!</strong> You understand key statutory concepts. Review the detailed mastery module below to sharpen every threshold.</p>
              ) : (
                <p>💡 <strong>Room for Improvement:</strong> Explore the interactive Corporate Compliance &amp; Sandbox evaluators below to master the exact statutory rules.</p>
              )}
            </div>

            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow transition-all inline-flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Quiz</span>
            </button>
          </div>
        )}
      </div>

      {/* Specialized Corporate Banking Compliance, Section 56/56Ka & Startup Sandbox Mastery Suite */}
      <CorporateComplianceMasteryQuiz initialTopic="ALL" />
    </div>
  );
};
