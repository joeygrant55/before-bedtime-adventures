import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Custom hook for debouncing a value
 */
export function useDebounce<T>(value: T, delay: number): T {
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

/**
 * Custom hook for debouncing a callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Custom hook for optimistic updates
 */
export function useOptimistic<T, U>(
  initialValue: T,
  updateFn: (currentState: T, optimisticValue: U) => T
): [T, (optimisticValue: U) => void, (actualValue: T) => void] {
  const [state, setState] = useState<T>(initialValue);
  const [optimisticState, setOptimisticState] = useState<T | null>(null);

  const addOptimistic = useCallback(
    (optimisticValue: U) => {
      setOptimisticState(updateFn(state, optimisticValue));
    },
    [state, updateFn]
  );

  const confirmUpdate = useCallback((actualValue: T) => {
    setState(actualValue);
    setOptimisticState(null);
  }, []);

  return [optimisticState ?? state, addOptimistic, confirmUpdate];
}

/**
 * Custom hook for tracking async operation state
 */
export function useAsyncOperation<T = void>() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (operation: () => Promise<T>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await operation();
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  return { isLoading, error, data, execute, reset };
}

/**
 * Custom hook for retry logic
 */
export function useRetry(maxRetries: number = 3, retryDelay: number = 1000) {
  const [attempts, setAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T> => {
      setIsRetrying(true);
      let lastError: Error | null = null;

      for (let i = 0; i <= maxRetries; i++) {
        try {
          setAttempts(i + 1);
          const result = await operation();
          setIsRetrying(false);
          return result;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          if (i < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay * (i + 1)));
          }
        }
      }

      setIsRetrying(false);
      throw lastError;
    },
    [maxRetries, retryDelay]
  );

  const reset = useCallback(() => {
    setAttempts(0);
    setIsRetrying(false);
  }, []);

  return { retry, attempts, isRetrying, reset };
}

/**
 * Custom hook for lazy loading images
 */
export function useLazyImage(src: string | null | undefined) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) {
      setIsLoaded(false);
      setHasError(false);
      return;
    }

    const img = new Image();
    img.src = src;

    img.onload = () => {
      setIsLoaded(true);
      setHasError(false);
    };

    img.onerror = () => {
      setIsLoaded(false);
      setHasError(true);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { isLoaded, hasError };
}
