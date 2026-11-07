import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

interface InteractiveChecklistItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  articleId: string;
}

function extractText(node: any): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (React.isValidElement(node)) {
    return extractText((node.props as any).children);
  }
  return '';
}

export function InteractiveChecklistItem({ articleId, children, ...props }: InteractiveChecklistItemProps) {
  // Extract text to use as a stable key.
  const textContent = extractText(children).replace(/[^a-zA-Z0-9]/g, '');

  // Only consider it a checklist item if there's actual text
  if (!textContent || textContent.length < 3) {
    return <li {...props}>{children}</li>;
  }

  const storageKey = `checklist-${articleId}-${textContent.substring(0, 40)}`;
  const [isChecked, setIsChecked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      if (stored === 'true') {
        setIsChecked(true);
        // Migrate to new format
        localStorage.setItem(storageKey, JSON.stringify({ checked: true, text: extractText(children) }));
      } else if (stored === 'false') {
        setIsChecked(false);
      } else {
        try {
          const parsed = JSON.parse(stored);
          setIsChecked(parsed.checked);
        } catch(e) {}
      }
    }
  }, [storageKey]);

  const toggleCheck = (e: React.MouseEvent) => {
    // Prevent toggling when clicking links or nested lists
    if ((e.target as HTMLElement).tagName.toLowerCase() === 'a') return;
    
    // Check if the click happened inside a nested list; if so, do not toggle the parent
    const target = e.target as HTMLElement;
    if (target.closest('ul') !== e.currentTarget.closest('ul') && target.closest('li') !== e.currentTarget) {
        return;
    }

    e.stopPropagation();
    const nextState = !isChecked;
    setIsChecked(nextState);
    localStorage.setItem(storageKey, JSON.stringify({ checked: nextState, text: extractText(children) }));
  };

  if (!mounted) {
    // Render without check mark initially to avoid hydration mismatch if SSR (though this is SPA)
    // But mainly to let useEffect run
    return <li {...props}>{children}</li>;
  }

  // Check if children contain a nested list
  const hasNestedList = React.Children.toArray(children).some(
    (child: any) => React.isValidElement(child) && (child.type === 'ul' || child.type === 'ol')
  );

  let mainContent: React.ReactNode[] = [];
  let nestedLists: React.ReactNode[] = [];

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && (child.type === 'ul' || child.type === 'ol')) {
      nestedLists.push(child);
    } else {
      mainContent.push(child);
    }
  });

  return (
    <li 
      {...props} 
      className={`flex flex-col mb-2 list-none p-0 ${props.className || ''}`}
    >
      <div 
        className="flex items-start gap-3 cursor-pointer group" 
        onClick={toggleCheck}
      >
        <div 
          className={`mt-1.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
            isChecked 
              ? 'bg-emerald-600 border-emerald-600' 
              : 'bg-white border-slate-300 group-hover:border-emerald-400'
          }`}
        >
          {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
        </div>
        <div className={`flex-1 transition-colors [&>div>p]:m-0 [&>p]:m-0 ${isChecked ? 'text-slate-400' : 'text-slate-700'}`}>
          <div className={isChecked ? 'line-through opacity-60' : ''}>
            {mainContent}
          </div>
          {nestedLists.length > 0 && (
            <div className="mt-2 text-slate-700 !no-underline !opacity-100" onClick={(e) => e.stopPropagation()}>
              {nestedLists}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
