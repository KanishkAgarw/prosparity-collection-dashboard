
import { useState, useCallback, useRef } from 'react';

export const useDebouncedAPI = <T,>(
  apiFunction: (...args: any[]) => Promise<T>,
  delay: number = 500
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const requestIdRef = useRef(0);

  const debouncedCall = useCallback(
    (...args: any[]) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Increment request ID to handle race conditions
      const currentRequestId = ++requestIdRef.current;

      // Set loading state immediately
      setLoading(true);
      setError(null);

      timeoutRef.current = setTimeout(async () => {
        try {
          console.log('Debounced API call executing with args:', args);
          const result = await apiFunction(...args);
          
          // Only update if this is still the latest request
          if (currentRequestId === requestIdRef.current) {
            setData(result);
            setError(null);
          }
        } catch (err) {
          if (currentRequestId === requestIdRef.current) {
            setError(err as Error);
            console.error('Debounced API call failed:', err);
          }
        } finally {
          if (currentRequestId === requestIdRef.current) {
            setLoading(false);
          }
        }
      }, delay);
    },
    [apiFunction, delay]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    call: debouncedCall,
    cancel
  };
};
