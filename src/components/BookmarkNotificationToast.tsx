import React from 'react';
import { useBookmarks } from '../contexts/BookmarkContext';
import { useAuth } from '../contexts/AuthContext';
import { Bookmark, Check, Trash2, X, LogIn, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export function BookmarkNotificationToast() {
  const { feedback, clearFeedback } = useBookmarks();
  const { user, signInWithGoogle } = useAuth();

  if (!feedback) return null;

  return (
    <div 
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[120] max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-700/80 backdrop-blur-md flex items-start gap-3.5">
        <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
          feedback.type === 'removed' 
            ? 'bg-rose-500/20 text-rose-400' 
            : 'bg-emerald-500/20 text-emerald-400'
        }`}>
          {feedback.type === 'removed' ? (
            <Trash2 className="w-4 h-4" />
          ) : (
            <Check className="w-4 h-4" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
              <span>{feedback.type === 'removed' ? 'Bookmark Removed' : 'Bookmark Saved'}</span>
            </h4>
            <button
              onClick={clearFeedback}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-slate-300 mt-1 leading-snug">
            {feedback.message}
          </p>

          {feedback.articleTitle && (
            <p className="text-[11px] text-emerald-300 font-semibold truncate mt-1">
              "{feedback.articleTitle}"
            </p>
          )}

          <div className="mt-2.5 flex items-center gap-3 pt-2 border-t border-slate-800 text-xs">
            <Link
              to="/dashboard?tab=saved"
              onClick={clearFeedback}
              className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1"
            >
              <span>View in Dashboard</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            {!user && (
              <button
                onClick={() => {
                  clearFeedback();
                  signInWithGoogle();
                }}
                className="text-[11px] font-semibold text-slate-300 hover:text-white inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg transition-colors ml-auto"
              >
                <LogIn className="w-3 h-3 text-emerald-400" />
                <span>Sign in</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
