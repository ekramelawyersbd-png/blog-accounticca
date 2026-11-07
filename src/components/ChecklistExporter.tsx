import React, { useState, useEffect } from 'react';
import { Download, FileJson, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

interface ChecklistExporterProps {
  articleId: string;
}

export function ChecklistExporter({ articleId }: ChecklistExporterProps) {
  if (articleId !== 'personal-income-tax-return-submission-guide-2025-2026') return null;

  const [hasItems, setHasItems] = useState(false);

  useEffect(() => {
    // Check if there are any checklist items for this article
    const prefix = `checklist-${articleId}-`;
    let found = false;
    for (let i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i)?.startsWith(prefix)) {
        found = true;
        break;
      }
    }
    setHasItems(found);
  }, [articleId]);

  // Removed: if (!hasItems) return null; -> Let's always show it if it's the checklist article.

  const exportData = (format: 'csv' | 'json') => {
    const prefix = `checklist-${articleId}-`;
    const items: { text: string; checked: boolean }[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            if (value === 'true' || value === 'false') {
              items.push({ text: key.replace(prefix, ''), checked: value === 'true' });
            } else {
              const parsed = JSON.parse(value);
              items.push({ text: parsed.text || key.replace(prefix, ''), checked: !!parsed.checked });
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
    }

    if (items.length === 0) {
      alert("No checklist items found. Check some items first to export them.");
      return;
    }

    let content = '';
    let mimeType = '';
    let extension = '';

    if (format === 'csv') {
      content = 'Status,Task\n' + items.map(item => `"${item.checked ? 'Completed' : 'Pending'}","${item.text.replace(/"/g, '""')}"`).join('\n');
      mimeType = 'text/csv';
      extension = 'csv';
    } else {
      content = JSON.stringify(items, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-checklist-${new Date().toISOString().split('T')[0]}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl mt-8 mb-12 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          Export Your Checklist
        </h3>
        <p className="text-sm text-slate-600 mt-1">Download your progress for personal records or to share with your tax consultant.</p>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <button
          onClick={() => exportData('csv')}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" /> CSV
        </button>
        <button
          onClick={() => exportData('json')}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
        >
          <FileJson className="w-4 h-4" /> JSON
        </button>
      </div>
    </div>
  );
}
