export type SortDirection = 'asc' | 'desc';

export interface SortConfig<K extends string = string> {
  key: K;
  direction: SortDirection;
}

const BANGLA_DIGIT_MAP: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

const NATURAL_COLLATOR = new Intl.Collator('en', {
  numeric: true,
  sensitivity: 'base',
});

const EMPTY_MARKERS = new Set(['', '-', '—', '–', 'n/a', 'na', 'none', 'null', 'undefined', 'tbd']);

const MONTH_MAP: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

export function normalizeDigits(input: string): string {
  return input.replace(/[০-৯]/g, (digit) => BANGLA_DIGIT_MAP[digit] ?? digit);
}

interface ParsedSortValue {
  kind: 'empty' | 'number' | 'date' | 'string';
  num: number;
  str: string;
}

function tryParseDate(normalized: string): number | null {
  // ISO date: YYYY-MM-DD or YYYY/MM/DD (with optional time)
  const isoMatch = normalized.match(
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?/
  );
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    const hour = isoMatch[4] ? Number(isoMatch[4]) : 0;
    const min = isoMatch[5] ? Number(isoMatch[5]) : 0;
    const sec = isoMatch[6] ? Number(isoMatch[6]) : 0;
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      return Date.UTC(year, month, day, hour, min, sec);
    }
  }

  // DD/MM/YYYY or DD-MM-YYYY (with optional time)
  const dmyMatch = normalized.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?$/i
  );
  if (dmyMatch) {
    const first = Number(dmyMatch[1]);
    const second = Number(dmyMatch[2]);
    const year = Number(dmyMatch[3]);
    let hour = dmyMatch[4] ? Number(dmyMatch[4]) : 0;
    const min = dmyMatch[5] ? Number(dmyMatch[5]) : 0;
    const sec = dmyMatch[6] ? Number(dmyMatch[6]) : 0;
    const meridiem = dmyMatch[7]?.toLowerCase();
    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;

    // Treat as DD/MM/YYYY unless second > 12 (then MM/DD/YYYY)
    const day = second > 12 ? second : first;
    const month = (second > 12 ? first : second) - 1;
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      return Date.UTC(year, month, day, hour, min, sec);
    }
  }

  // DD MMM YYYY (e.g., 15 Nov 2026)
  const dMonY = normalized.match(/^(\d{1,2})\s+([a-zA-Z]{3,9}),?\s+(\d{4})$/);
  if (dMonY) {
    const day = Number(dMonY[1]);
    const month = MONTH_MAP[dMonY[2].toLowerCase()];
    const year = Number(dMonY[3]);
    if (month !== undefined && day >= 1 && day <= 31) {
      return Date.UTC(year, month, day);
    }
  }

  // MMM DD, YYYY (e.g., Nov 15, 2026)
  const monDY = normalized.match(/^([a-zA-Z]{3,9})\s+(\d{1,2}),?\s+(\d{4})$/);
  if (monDY) {
    const month = MONTH_MAP[monDY[1].toLowerCase()];
    const day = Number(monDY[2]);
    const year = Number(monDY[3]);
    if (month !== undefined && day >= 1 && day <= 31) {
      return Date.UTC(year, month, day);
    }
  }

  return null;
}

function tryParseNumber(normalized: string): number | null {
  // File size: e.g. "1.8 MB", "950 KB", "2.1 GB"
  const sizeMatch = normalized.match(/^([+-]?\d+(?:\.\d+)?)\s*(b|bytes?|kb|mb|gb|tb)$/i);
  if (sizeMatch) {
    const base = Number(sizeMatch[1]);
    const unit = sizeMatch[2].toLowerCase();
    const mult =
      unit.startsWith('t') ? 1024 ** 4 :
      unit.startsWith('g') ? 1024 ** 3 :
      unit.startsWith('m') ? 1024 ** 2 :
      unit.startsWith('k') ? 1024 : 1;
    return base * mult;
  }

  // Fraction: e.g. "4/5" or "12 / 15"
  const fracMatch = normalized.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (fracMatch) {
    const denom = Number(fracMatch[2]);
    if (denom > 0) return Number(fracMatch[1]) / denom;
  }

  // Rank / points / percentage / currency / South Asian units:
  // e.g. "#1", "BDT 1,50,000", "৳420,000", "Tk. 25,000", "15%", "27.5% (Standard)", "2.5 Crore", "5 Lakh", "120 pts"
  const cleaned = normalized
    .replace(/^(?:#|no\.?\s*)/i, '')
    .replace(/^(?:bdt|tk\.?|taka|usd|\$|€|£|৳)\s*/i, '')
    .replace(/\s*(?:bdt|tk\.?|taka|usd|\$|€|£|৳|pts?|points?|%|x)$/i, '')
    .trim();

  // Check for pure number with optional scale suffix (K, M, B, Lakh/Lac, Crore/Cr)
  const scaledMatch = cleaned.match(
    /^([+-]?(?:\d{1,3}(?:,\d{2,3})+|\d+)(?:\.\d+)?)\s*(k|m|b|lakh|lac|crore|cr)?$/i
  );
  if (scaledMatch) {
    const rawNum = Number(scaledMatch[1].replace(/,/g, ''));
    if (!Number.isNaN(rawNum)) {
      const unit = scaledMatch[2]?.toLowerCase();
      if (!unit) return rawNum;
      if (unit === 'k') return rawNum * 1_000;
      if (unit === 'lakh' || unit === 'lac') return rawNum * 100_000;
      if (unit === 'm') return rawNum * 1_000_000;
      if (unit === 'crore' || unit === 'cr') return rawNum * 10_000_000;
      if (unit === 'b') return rawNum * 1_000_000_000;
    }
  }

  // Rate with parenthetical note: e.g. "15% (Standard)" or "TTI: 58.6%"
  const leadingRateMatch = normalized.match(
    /^(?:tti:\s*)?([+-]?\d+(?:\.\d+)?)\s*%(?:\s*\([^)]*\))?$/i
  );
  if (leadingRateMatch) {
    const val = Number(leadingRateMatch[1]);
    if (!Number.isNaN(val)) return val;
  }

  // Accounting negative in parentheses: "(BDT 550,000)" or "(1,200.50)"
  const parenNegMatch = normalized.match(
    /^\(\s*(?:bdt|tk\.?|৳|\$)?\s*(\d[\d,]*(?:\.\d+)?)\s*\)$/i
  );
  if (parenNegMatch) {
    const val = Number(parenNegMatch[1].replace(/,/g, ''));
    if (!Number.isNaN(val)) return -val;
  }

  return null;
}

export function parseSortableValue(raw: unknown): ParsedSortValue {
  if (raw === null || raw === undefined) {
    return { kind: 'empty', num: 0, str: '' };
  }
  if (typeof raw === 'number') {
    if (Number.isNaN(raw)) return { kind: 'empty', num: 0, str: '' };
    return { kind: 'number', num: raw, str: String(raw) };
  }
  if (typeof raw === 'boolean') {
    return { kind: 'number', num: raw ? 1 : 0, str: raw ? 'true' : 'false' };
  }
  if (raw instanceof Date) {
    const ts = raw.getTime();
    return Number.isNaN(ts)
      ? { kind: 'empty', num: 0, str: '' }
      : { kind: 'date', num: ts, str: raw.toISOString() };
  }

  const normalized = normalizeDigits(String(raw)).replace(/\s+/g, ' ').trim();
  if (EMPTY_MARKERS.has(normalized.toLowerCase())) {
    return { kind: 'empty', num: 0, str: '' };
  }

  const parsedDate = tryParseDate(normalized);
  if (parsedDate !== null) {
    return { kind: 'date', num: parsedDate, str: normalized };
  }

  const parsedNum = tryParseNumber(normalized);
  if (parsedNum !== null) {
    return { kind: 'number', num: parsedNum, str: normalized };
  }

  return { kind: 'string', num: 0, str: normalized };
}

export function compareValues(a: unknown, b: unknown, direction: SortDirection = 'asc'): number {
  const pa = parseSortableValue(a);
  const pb = parseSortableValue(b);

  // Always keep empty values at the bottom for usability
  if (pa.kind === 'empty' && pb.kind === 'empty') return 0;
  if (pa.kind === 'empty') return 1;
  if (pb.kind === 'empty') return -1;

  const mult = direction === 'asc' ? 1 : -1;

  if (pa.kind === 'number' && pb.kind === 'number') {
    if (pa.num !== pb.num) return (pa.num - pb.num) * mult;
    return NATURAL_COLLATOR.compare(pa.str, pb.str) * mult;
  }

  if (pa.kind === 'date' && pb.kind === 'date') {
    if (pa.num !== pb.num) return (pa.num - pb.num) * mult;
    return 0;
  }

  return NATURAL_COLLATOR.compare(pa.str, pb.str) * mult;
}

export function sortByConfig<T, K extends string = string>(
  items: readonly T[],
  sortConfig: SortConfig<K> | null,
  accessors?: Partial<Record<K, (item: T) => unknown>>
): T[] {
  if (!sortConfig || items.length <= 1) {
    return [...items];
  }

  const getter = accessors?.[sortConfig.key];
  const indexed = items.map((item, idx) => ({ item, idx }));

  indexed.sort((a, b) => {
    const valA = getter ? getter(a.item) : (a.item as Record<string, unknown>)[sortConfig.key];
    const valB = getter ? getter(b.item) : (b.item as Record<string, unknown>)[sortConfig.key];
    const cmp = compareValues(valA, valB, sortConfig.direction);
    return cmp !== 0 ? cmp : a.idx - b.idx;
  });

  return indexed.map((entry) => entry.item);
}

/**
 * Extracts a clean sortable value from a DOM table cell, supporting
 * custom `data-sort-value`, inline `<input>` / `<select>`, or text content.
 */
export function extractCellSortValue(cell: Element | undefined | null): string {
  if (!cell) return '';

  const explicit = cell.getAttribute('data-sort-value');
  if (explicit !== null) return explicit;

  const input = cell.querySelector<HTMLInputElement | HTMLSelectElement>(
    'input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]), select'
  );
  if (input && input.value !== '') {
    return input.value;
  }

  return (cell.textContent || '').replace(/\s+/g, ' ').trim();
}
