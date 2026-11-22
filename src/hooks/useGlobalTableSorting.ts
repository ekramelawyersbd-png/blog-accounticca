import { useEffect } from 'react';
import { compareValues, extractCellSortValue, SortDirection } from '../utils/tableSort';

const NON_SORTABLE_HEADER_RE =
  /^(?:actions?|action\s*\/\s*status|refund\s+action|select|delete|edit|manage|options?|preview|download)$/i;

const SUMMARY_ROW_RE =
  /^(?:total|grand\s+total|net\s+total|subtotal|sub-total|summary|overall|মোট|সর্বমোট)\b/i;

interface TableSortState {
  columnIndex: number;
  direction: SortDirection;
}

interface RowGroup {
  primary: HTMLTableRowElement;
  followers: HTMLTableRowElement[];
  originalIndex: number;
}

const tableSortStateMap = new WeakMap<HTMLTableElement, TableSortState>();
const enhancedTables = new WeakSet<HTMLTableElement>();
const isMutatingTable = new WeakSet<HTMLTableElement>();

function getHeaderRow(table: HTMLTableElement): HTMLTableRowElement | null {
  const thead = table.tHead;
  if (!thead || thead.rows.length === 0) return null;
  // Use the last header row (handles grouped multi-row headers cleanly)
  return thead.rows[thead.rows.length - 1];
}

function isSortableHeaderCell(th: HTMLTableCellElement): boolean {
  if (th.getAttribute('data-no-sort') === 'true') return false;
  if (th.colSpan > 1) return false;
  if (th.querySelector('input[type="checkbox"], input[type="radio"]')) return false;

  const text = (th.textContent || '').replace(/\s+/g, ' ').trim();
  if (!text) return false;
  if (NON_SORTABLE_HEADER_RE.test(text)) return false;

  return true;
}

function isPinnedBottomRow(row: HTMLTableRowElement): boolean {
  if (row.getAttribute('data-sort-pin') === 'bottom') return true;
  if (row.getAttribute('data-summary-row') === 'true') return true;
  const firstCellText = (row.cells[0]?.textContent || '').replace(/\s+/g, ' ').trim();
  if (SUMMARY_ROW_RE.test(firstCellText)) return true;
  return false;
}

function isFullWidthSpanRow(row: HTMLTableRowElement, expectedCols: number): boolean {
  return (
    row.cells.length === 1 &&
    row.cells[0].colSpan >= Math.max(2, expectedCols - 1)
  );
}

function applyTableSort(
  table: HTMLTableElement,
  columnIndex: number,
  direction: SortDirection
): void {
  const tbody = table.tBodies[0];
  if (!tbody) return;

  const headerRow = getHeaderRow(table);
  if (!headerRow) return;

  const expectedCols = headerRow.cells.length;
  const rows = Array.from(tbody.rows);
  if (rows.length < 2) return;

  // Skip tables with complex vertical rowSpan merges in body cells
  const hasBodyRowSpan = rows.some((row) =>
    Array.from(row.cells).some((cell) => cell.rowSpan > 1)
  );
  if (hasBodyRowSpan) return;

  // Separate pinned bottom summary rows (e.g. "Total" rows in calculators)
  const pinnedBottom: HTMLTableRowElement[] = [];
  let endIdx = rows.length - 1;
  while (endIdx >= 0 && isPinnedBottomRow(rows[endIdx])) {
    pinnedBottom.unshift(rows[endIdx]);
    endIdx -= 1;
  }

  const activeRows = rows.slice(0, endIdx + 1);
  if (activeRows.length < 2) return;

  // Group any expandable detail rows (single full-width colspan row) with their parent row
  const groups: RowGroup[] = [];
  for (let i = 0; i < activeRows.length; i += 1) {
    const row = activeRows[i];
    if (isFullWidthSpanRow(row, expectedCols) && groups.length > 0) {
      groups[groups.length - 1].followers.push(row);
    } else {
      groups.push({
        primary: row,
        followers: [],
        originalIndex: groups.length,
      });
    }
  }

  if (groups.length < 2) return;

  groups.sort((a, b) => {
    const valA = extractCellSortValue(a.primary.cells[columnIndex]);
    const valB = extractCellSortValue(b.primary.cells[columnIndex]);
    const cmp = compareValues(valA, valB, direction);
    return cmp !== 0 ? cmp : a.originalIndex - b.originalIndex;
  });

  // Perform same-parent DOM reordering guarded against MutationObserver recursion
  isMutatingTable.add(table);
  try {
    const fragment = document.createDocumentFragment();
    for (const group of groups) {
      fragment.appendChild(group.primary);
      for (const follower of group.followers) {
        fragment.appendChild(follower);
      }
    }
    for (const pinned of pinnedBottom) {
      fragment.appendChild(pinned);
    }
    tbody.appendChild(fragment);
  } finally {
    // Release guard on next microtask so observer ignores our own batch
    Promise.resolve().then(() => {
      isMutatingTable.delete(table);
    });
  }

  // Update ARIA state on header cells
  Array.from(headerRow.cells).forEach((cell, idx) => {
    if (cell.getAttribute('data-sortable-col') === 'true') {
      cell.setAttribute(
        'aria-sort',
        idx === columnIndex
          ? direction === 'asc'
            ? 'ascending'
            : 'descending'
          : 'none'
      );
    }
  });
}

function handleHeaderActivation(table: HTMLTableElement, columnIndex: number): void {
  const current = tableSortStateMap.get(table);
  const nextDirection: SortDirection =
    current && current.columnIndex === columnIndex && current.direction === 'asc'
      ? 'desc'
      : 'asc';

  tableSortStateMap.set(table, { columnIndex, direction: nextDirection });
  applyTableSort(table, columnIndex, nextDirection);
}

function enhanceTable(table: HTMLTableElement): void {
  if (
    table.getAttribute('data-sort-managed') === 'react' ||
    table.getAttribute('data-no-sort') === 'true' ||
    table.getAttribute('role') === 'presentation'
  ) {
    return;
  }

  const headerRow = getHeaderRow(table);
  const tbody = table.tBodies[0];
  if (!headerRow || !tbody) return;

  // Skip tables with complex body rowSpan merges
  const hasBodyRowSpan = Array.from(tbody.rows).some((row) =>
    Array.from(row.cells).some((cell) => cell.rowSpan > 1)
  );
  if (hasBodyRowSpan) return;

  // Mark sortable header cells without injecting DOM child nodes into React-managed <th>
  const cells = Array.from(headerRow.cells);
  let sortableCount = 0;

  cells.forEach((cell, colIdx) => {
    if (cell.tagName !== 'TH') return;
    if (!isSortableHeaderCell(cell)) {
      cell.removeAttribute('data-sortable-col');
      cell.removeAttribute('aria-sort');
      return;
    }

    sortableCount += 1;
    cell.setAttribute('data-sortable-col', 'true');
    cell.setAttribute('data-sort-col-index', String(colIdx));

    if (!cell.hasAttribute('aria-sort')) {
      cell.setAttribute('aria-sort', 'none');
    }

    // Only set interactive button semantics if header doesn't already wrap an interactive element
    if (!cell.querySelector('button, a, input, select')) {
      if (!cell.hasAttribute('tabindex')) {
        cell.setAttribute('tabindex', '0');
      }
      if (!cell.hasAttribute('role')) {
        cell.setAttribute('role', 'button');
      }
    }

    const label = (cell.textContent || '').replace(/\s+/g, ' ').trim();
    if (label && !cell.getAttribute('title')) {
      cell.setAttribute('title', `Click to sort by ${label}`);
    }
  });

  if (sortableCount === 0 || enhancedTables.has(table)) {
    return;
  }

  enhancedTables.add(table);

  const onHeaderClick = (event: Event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    // Do not hijack clicks on links, inputs, or inner custom buttons
    if (target.closest('a, input, select, textarea')) return;

    const th = target.closest('th[data-sortable-col="true"]') as HTMLTableCellElement | null;
    if (!th || !headerRow.contains(th)) return;

    const colIdx = Number(th.getAttribute('data-sort-col-index'));
    if (Number.isNaN(colIdx)) return;

    handleHeaderActivation(table, colIdx);
  };

  const onHeaderKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (target.closest('a, input, select, textarea')) return;

    const th = target.closest('th[data-sortable-col="true"]') as HTMLTableCellElement | null;
    if (!th || !headerRow.contains(th)) return;

    event.preventDefault();
    const colIdx = Number(th.getAttribute('data-sort-col-index'));
    if (Number.isNaN(colIdx)) return;

    handleHeaderActivation(table, colIdx);
  };

  headerRow.addEventListener('click', onHeaderClick);
  headerRow.addEventListener('keydown', onHeaderKeyDown);
}

function scanAllTables(): void {
  const tables = document.querySelectorAll<HTMLTableElement>('table');
  tables.forEach((table) => {
    if (isMutatingTable.has(table)) return;
    enhanceTable(table);
  });
}

/**
 * Globally attaches interactive, accessible ascending/descending column sorting
 * to every data table in the application that does not already manage sorting in React state.
 */
export function useGlobalTableSorting(): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    let rafId: number | null = null;
    const scheduleScan = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        scanAllTables();
      });
    };

    // Initial pass
    scanAllTables();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type !== 'childList') continue;
        const targetEl =
          mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
        const closestTable = targetEl?.closest('table');
        if (closestTable && isMutatingTable.has(closestTable)) {
          continue;
        }
        // If rows were externally replaced/filtered in a previously sorted table, clear stale sort indicator
        if (
          closestTable &&
          targetEl?.tagName === 'TBODY' &&
          tableSortStateMap.has(closestTable)
        ) {
          tableSortStateMap.delete(closestTable);
          const headerRow = getHeaderRow(closestTable);
          if (headerRow) {
            Array.from(headerRow.cells).forEach((cell) => {
              if (cell.getAttribute('data-sortable-col') === 'true') {
                cell.setAttribute('aria-sort', 'none');
              }
            });
          }
        }
        scheduleScan();
        return;
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);
}
