import React, { useState } from 'react';
import { Bookmark, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBookmarks } from '../contexts/BookmarkContext';

export interface BookmarkButtonProps {
  id: string;
  title: string;
  url?: string;
  type?: 'article' | 'policy' | 'section';
  category?: string;
  categoryId?: string;
  readTime?: number;
  offlineExcerpt?: string;
  offlineImageUrl?: string;
  showLabel?: boolean;
  className?: string;
}

export function BookmarkButton({ 
  id, 
  title, 
  url, 
  type = 'article',
  category,
  categoryId,
  readTime,
  offlineExcerpt,
  offlineImageUrl,
  showLabel = false,
  className = ''
}: BookmarkButtonProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { user } = useAuth();
  const [justSaved, setJustSaved] = useState(false);

  const isSaved = isBookmarked(id);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const willBeSaved = !isSaved;
    if (willBeSaved) {
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    }

    await toggleBookmark({
      id,
      title,
      url: url || `/article/${id}`,
      type,
      category,
      categoryId,
      readTime,
      offlineExcerpt,
      offlineImageUrl,
      dateSaved: new Date().toISOString()
    });
  };

  const tooltipText = isSaved
    ? user
      ? "Saved to your private Dashboard"
      : "Bookmarked locally (Sign in to sync)"
    : "Save to personal Dashboard";

  if (showLabel) {
    return (
      <button
        id={`bookmark-btn-${id}`}
        type="button"
        onClick={handleToggle}
        title={tooltipText}
        aria-label={tooltipText}
        aria-pressed={isSaved}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
          isSaved
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs'
            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
        } ${className}`}
      >
        {justSaved ? (
          <Check className="w-4 h-4 text-emerald-600 animate-in zoom-in" />
        ) : (
          <Bookmark 
            className={`w-4 h-4 transition-transform active:scale-125 duration-150 ${isSaved ? "fill-current text-emerald-600" : "text-slate-400"}`} 
            fill={isSaved ? "currentColor" : "none"} 
          />
        )}
        <span>{isSaved ? "Saved to Dashboard" : "Bookmark"}</span>
      </button>
    );
  }

  return (
    <button 
      id={`bookmark-btn-${id}`}
      type="button"
      onClick={handleToggle}
      title={tooltipText}
      aria-label={tooltipText}
      aria-pressed={isSaved}
      className={`p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer relative group ${className}`}
    >
      <Bookmark 
        className={`w-5 h-5 transition-transform active:scale-125 duration-150 ${isSaved ? "fill-current text-emerald-600" : ""}`} 
        fill={isSaved ? "currentColor" : "none"} 
      />
    </button>
  );
}

