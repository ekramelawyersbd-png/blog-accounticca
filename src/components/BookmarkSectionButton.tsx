import { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { saveItem, removeItem, isItemSaved } from '../utils/readingList';

interface BookmarkSectionButtonProps {
  id: string;
  title: string;
  url: string;
  className?: string;
}

export function BookmarkSectionButton({ id, title, url, className }: BookmarkSectionButtonProps) {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setIsSaved(isItemSaved(id));
    const handleStorageChange = () => setIsSaved(isItemSaved(id));
    window.addEventListener('bookmarksUpdated', handleStorageChange);
    return () => window.removeEventListener('bookmarksUpdated', handleStorageChange);
  }, [id]);

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSaved) {
      removeItem(id);
    } else {
      saveItem({
        id,
        title,
        type: 'section',
        url,
        dateSaved: new Date().toISOString()
      });
    }
    
    // The state will update via the bookmarksUpdated event, 
    // but we can also optimistically update it here for immediate feedback
    setIsSaved(!isSaved);
  };

  return (
    <button
      onClick={toggleSave}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all shadow-sm",
        isSaved 
          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900",
        className
      )}
      title={isSaved ? "Remove from Dashboard" : "Save to Dashboard"}
      type="button"
    >
      {isSaved ? (
        <BookmarkCheck className="w-3.5 h-3.5" fill="currentColor" />
      ) : (
        <Bookmark className="w-3.5 h-3.5" />
      )}
      {isSaved ? "Saved" : "Save"}
    </button>
  );
}
