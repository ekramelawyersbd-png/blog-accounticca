import { useState, useEffect } from 'react';
import { StickyNote, Check, Save } from 'lucide-react';
import { cn } from '../lib/utils';

interface SectionNoteProps {
  id: string;
  isHighContrast?: boolean;
}

export function SectionNote({ id, isHighContrast }: SectionNoteProps) {
  const [note, setNote] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedNotes = JSON.parse(localStorage.getItem('sectionNotes') || '{}');
    if (savedNotes[id]) {
      setNote(savedNotes[id]);
      setIsExpanded(true); // Auto expand if there's a note
    }
  }, [id]);

  const handleSave = () => {
    const savedNotes = JSON.parse(localStorage.getItem('sectionNotes') || '{}');
    if (note.trim()) {
      savedNotes[id] = note;
    } else {
      delete savedNotes[id]; // clean up empty notes
    }
    localStorage.setItem('sectionNotes', JSON.stringify(savedNotes));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="mt-10 text-left w-full transition-all">
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className={cn(
            "flex items-center justify-center gap-2 text-sm font-semibold transition-colors mx-auto px-4 py-2 rounded-full border border-transparent",
            isHighContrast 
              ? "text-yellow-400 hover:text-black hover:bg-yellow-400 border-yellow-400/30" 
              : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100/50"
          )}
        >
          <StickyNote className="w-4 h-4" />
          Add Personal Note
        </button>
      ) : (
        <div className={cn(
          "p-5 rounded-2xl border transition-colors relative shadow-sm",
          isHighContrast ? "bg-black border-yellow-400" : "bg-white border-emerald-100"
        )}>
          <div className="flex items-center gap-2 mb-3">
            <StickyNote className={cn("w-4 h-4", isHighContrast ? "text-yellow-400" : "text-emerald-600")} />
            <span className={cn("text-sm font-bold", isHighContrast ? "text-yellow-400" : "text-slate-700")}>
              Personal Annotation
            </span>
          </div>
          <textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setIsSaved(false);
            }}
            placeholder="Type your personal annotations here. These notes are saved securely in your browser..."
            className={cn(
              "w-full min-h-[100px] bg-transparent border-none focus:ring-0 p-0 text-sm resize-y font-medium",
              isHighContrast ? "text-white placeholder:text-white/40" : "text-slate-700 placeholder:text-slate-400"
            )}
          />
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-dashed" style={{ borderColor: isHighContrast ? 'rgba(250, 204, 21, 0.4)' : 'rgba(16, 185, 129, 0.2)' }}>
            <span className={cn("text-xs font-medium", isHighContrast ? "text-white/70" : "text-slate-500")}>
              Saved locally on this device
            </span>
            <button
              onClick={handleSave}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm",
                isHighContrast 
                  ? (isSaved ? "bg-yellow-400 text-black" : "border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black") 
                  : (isSaved ? "bg-emerald-100 text-emerald-700" : "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100")
              )}
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {isSaved ? "Saved" : "Save Note"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
