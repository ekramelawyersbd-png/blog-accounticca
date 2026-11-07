import { useState, useEffect, useMemo } from 'react';
import { z } from 'zod';

/**
 * Custom debounce hook that delays updating the returned value until
 * the caller stops changing `value` for the specified `delay` (default 300ms).
 * Used across all form inputs to prevent excessive Zod validation re-runs
 * while the user is actively typing.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export interface DebouncedZodValidationResult<T extends z.ZodTypeAny> {
  debouncedData: z.input<T>;
  validationResult: z.ZodSafeParseResult<z.output<T>>;
  fieldErrors: Record<string, string>;
  isValid: boolean;
  isDebouncing: boolean;
}

/**
 * Hook that pairs `useDebounce` (300ms default) with a Zod schema so that
 * `schema.safeParse` only executes after the user stops typing for 300ms.
 */
export function useDebouncedZodValidation<T extends z.ZodTypeAny>(
  schema: T,
  data: z.input<T>,
  delay: number = 300
): DebouncedZodValidationResult<T> {
  const debouncedData = useDebounce(data, delay);

  const isDebouncing = useMemo(() => {
    try {
      return JSON.stringify(data) !== JSON.stringify(debouncedData);
    } catch {
      return data !== debouncedData;
    }
  }, [data, debouncedData]);

  const validationResult = useMemo(() => {
    return schema.safeParse(debouncedData);
  }, [schema, debouncedData]);

  const fieldErrors = useMemo(() => {
    const map: Record<string, string> = {};
    if (!validationResult.success) {
      validationResult.error.issues.forEach((issue) => {
        const key = issue.path[0]?.toString() || 'general';
        if (!map[key]) {
          map[key] = issue.message;
        }
      });
    }
    return map;
  }, [validationResult]);

  return {
    debouncedData,
    validationResult,
    fieldErrors,
    isValid: validationResult.success,
    isDebouncing,
  };
}

export default useDebounce;
