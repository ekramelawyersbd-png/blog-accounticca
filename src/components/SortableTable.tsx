import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const extractText = (node: any): string => {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (React.isValidElement(node)) {
    return extractText((node.props as any).children);
  }
  return '';
};

export function SortableTable({ children, ...props }: any) {
  const [sortConfig, setSortConfig] = useState<{ index: number; direction: 'asc' | 'desc' } | null>(null);

  const childrenArray = React.Children.toArray(children);
  
  const thead = childrenArray.find((c: any) => c.props?.node?.tagName === 'thead' || c.type === 'thead');
  const tbody = childrenArray.find((c: any) => c.props?.node?.tagName === 'tbody' || c.type === 'tbody');

  if (!thead || !tbody) {
    return (
      <div className="not-prose overflow-x-auto my-10 rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-left border-collapse min-w-[600px]" {...props}>{children}</table>
      </div>
    );
  }

  const theadChildren = React.Children.toArray((thead as any).props.children);
  const theadRow = theadChildren.find((c: any) => c.props?.node?.tagName === 'tr' || c.type === 'tr');
  const thElements = theadRow ? React.Children.toArray((theadRow as any).props.children) : [];

  const tbodyRows = React.Children.toArray((tbody as any).props.children).filter((c: any) => c.props?.node?.tagName === 'tr' || c.type === 'tr');

  const sortedRows = [...tbodyRows].sort((a: any, b: any) => {
    if (!sortConfig) return 0;
    const aCells = React.Children.toArray(a.props.children).filter((c: any) => c.props?.node?.tagName === 'td' || c.type === 'td');
    const bCells = React.Children.toArray(b.props.children).filter((c: any) => c.props?.node?.tagName === 'td' || c.type === 'td');

    const aText = extractText(aCells[sortConfig.index] || '').trim();
    const bText = extractText(bCells[sortConfig.index] || '').trim();

    const aNum = parseFloat(aText.replace(/[^0-9.-]+/g, ""));
    const bNum = parseFloat(bText.replace(/[^0-9.-]+/g, ""));
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
    }

    return sortConfig.direction === 'asc' 
      ? aText.localeCompare(bText) 
      : bText.localeCompare(aText);
  });

  const handleSort = (index: number) => {
    setSortConfig(current => {
      if (current?.index === index) {
        return { index, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { index, direction: 'asc' };
    });
  };

  return (
    <div className="not-prose my-10 rounded-xl border border-slate-200 shadow-md overflow-hidden bg-white">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[550px]" {...props}>
        <thead className="bg-emerald-800 text-white border-b-4 border-emerald-900">
          <tr>
            {thElements.map((th: any, index) => (
              <th 
                key={index}
                className="px-6 py-4 font-bold text-sm uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-emerald-700 transition-colors group select-none"
                onClick={() => handleSort(index)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{extractText(th)}</span>
                  <span className="text-emerald-300 group-hover:text-white transition-colors">
                    {sortConfig?.index === index ? (
                      sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    ) : (
                      <ArrowUpDown className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                    )}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {sortedRows.map((row: any, i) => {
            const cells = React.Children.toArray(row.props.children).filter((c: any) => c.props?.node?.tagName === 'td' || c.type === 'td');
            return (
              <tr key={i} className="hover:bg-emerald-50/50 transition-colors even:bg-slate-50/50">
                {cells.map((cell: any, j) => (
                  <td key={j} className="px-6 py-4 text-sm text-slate-700 leading-relaxed">
                    {cell.props.children}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
