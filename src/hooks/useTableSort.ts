import { useCallback, useMemo, useState } from 'react';
import { SortConfig, SortDirection, sortByConfig } from '../utils/tableSort';

export interface UseTableSortOptions<T, K extends string> {
  initialSort?: SortConfig<K> | null;
  accessors?: Partial<Record<K, (item: T) => unknown>>;
}

export interface UseTableSortResult<T, K extends string> {
  sortedItems: T[];
  sortConfig: SortConfig<K> | null;
  requestSort: (key: K) => void;
  resetSort: () => void;
  getSortDirection: (key: K) => SortDirection | null;
  getAriaSort: (key: K) => 'ascending' | 'descending' | 'none';
}

export function useTableSort<T, K extends string = string>(
  items: readonly T[],
  options?: UseTableSortOptions<T, K>
): UseTableSortResult<T, K> {
  const [sortConfig, setSortConfig] = useState<SortConfig<K> | null>(
    options?.initialSort ?? null
  );

  const requestSort = useCallback((key: K) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  const resetSort = useCallback(() => {
    setSortConfig(null);
  }, []);

  const getSortDirection = useCallback(
    (key: K): SortDirection | null => {
      return sortConfig?.key === key ? sortConfig.direction : null;
    },
    [sortConfig]
  );

  const getAriaSort = useCallback(
    (key: K): 'ascending' | 'descending' | 'none' => {
      if (sortConfig?.key !== key) return 'none';
      return sortConfig.direction === 'asc' ? 'ascending' : 'descending';
    },
    [sortConfig]
  );

  const accessors = options?.accessors;

  const sortedItems = useMemo(
    () => sortByConfig(items, sortConfig, accessors),
    [items, sortConfig, accessors]
  );

  return {
    sortedItems,
    sortConfig,
    requestSort,
    resetSort,
    getSortDirection,
    getAriaSort,
  };
}
