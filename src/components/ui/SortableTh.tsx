import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { SortDirection } from '../../utils/tableSort';

export interface SortableThProps<K extends string = string> {
  label: React.ReactNode;
  sortKey: K;
  direction: SortDirection | null;
  onSort: (key: K) => void;
  align?: 'left' | 'center' | 'right';
  tone?: 'light' | 'dark';
  className?: string;
  buttonClassName?: string;
}

export function SortableTh<K extends string = string>({
  label,
  sortKey,
  direction,
  onSort,
  align = 'left',
  tone = 'light',
  className = '',
  buttonClassName = '',
}: SortableThProps<K>) {
  const ariaSort =
    direction === 'asc'
      ? 'ascending'
      : direction === 'desc'
      ? 'descending'
      : 'none';

  const justifyClass =
    align === 'right'
      ? 'justify-end text-right'
      : align === 'center'
      ? 'justify-center text-center'
      : 'justify-start text-left';

  const iconColor =
    tone === 'dark'
      ? direction
        ? 'text-emerald-300 opacity-100'
        : 'text-white/50 group-hover:text-white/90'
      : direction
      ? 'text-emerald-700 opacity-100'
      : 'text-slate-400 group-hover:text-slate-700';

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={`select-none ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`group inline-flex w-full items-center gap-1.5 text-inherit [font:inherit] [letter-spacing:inherit] [text-transform:inherit] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 rounded-sm transition-colors ${justifyClass} ${buttonClassName}`}
        title={
          direction === 'asc'
            ? 'Sorted ascending — click to sort descending'
            : direction === 'desc'
            ? 'Sorted descending — click to sort ascending'
            : 'Click to sort column'
        }
      >
        <span className="truncate">{label}</span>
        <span className={`shrink-0 transition-colors ${iconColor}`} aria-hidden="true">
          {direction === 'asc' ? (
            <ArrowUp className="w-3.5 h-3.5" />
          ) : direction === 'desc' ? (
            <ArrowDown className="w-3.5 h-3.5" />
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5" />
          )}
        </span>
      </button>
    </th>
  );
}
