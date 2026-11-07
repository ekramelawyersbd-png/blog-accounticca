import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

export interface FieldTooltipProps {
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'right' | 'left';
  align?: 'center' | 'start' | 'end';
  className?: string;
  label?: string;
}

/**
 * FieldTooltip
 * Subtle, non-intrusive micro-tooltip providing context or guidance for form fields.
 * Engineered to prevent parent <label> click propagation, avoid premature blur,
 * maintain responsive viewport safety, and support both touch and hover interactions.
 */
export const FieldTooltip: React.FC<FieldTooltipProps> = ({
  content,
  position = 'top',
  align = 'start',
  className = '',
  label = 'Field information'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const closeTimerRef = useRef<any>(null);

  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, [isOpen]);

  // Position classes
  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2'
  }[position];

  // Align classes for vertical positions (top / bottom)
  let alignClasses = '';
  if (position === 'top' || position === 'bottom') {
    if (align === 'start') {
      alignClasses = 'left-0';
    } else if (align === 'end') {
      alignClasses = 'right-0';
    } else {
      alignClasses = 'left-0 sm:left-1/2 sm:-translate-x-1/2';
    }
  }

  return (
    <span
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-flex items-center align-middle ${className}`}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={isOpen}
        onFocus={() => setIsOpen(true)}
        onBlur={(e) => {
          // Prevent blur closing if focus moved into tooltip
          if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
            closeTimerRef.current = setTimeout(() => setIsOpen(false), 150);
          }
        }}
        onMouseDown={(e) => {
          // Critical: Prevent parent <label> from receiving mousedown and shifting focus to the input
          e.preventDefault();
          e.stopPropagation();
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="text-slate-400 hover:text-slate-600 focus:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition-colors p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-help inline-flex items-center justify-center"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {/* Floating Tooltip Box */}
      <span
        ref={tooltipRef}
        role="tooltip"
        aria-hidden={!isOpen}
        onClick={(e) => e.stopPropagation()}
        className={`absolute ${positionClasses} ${alignClasses} z-[9999] w-64 max-w-[85vw] p-3 bg-slate-900 text-slate-100 text-[11px] font-normal leading-relaxed rounded-xl shadow-2xl border border-slate-700 backdrop-blur-md transition-all duration-150 transform select-text ${
          isOpen
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto visible'
            : 'opacity-0 translate-y-1 scale-95 pointer-events-none invisible'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">{content}</div>
          <button
            type="button"
            aria-label="Close tooltip"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="sm:hidden text-slate-400 hover:text-white p-0.5 -mt-0.5 -mr-1 rounded-md"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </span>
    </span>
  );
};
