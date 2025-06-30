
import { useState, useCallback, useRef, useEffect } from 'react';

export const useDebouncedAPI = <T,>(
  apiFunction: () => Promise<T>,
  debounceMs: number = 300
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const cancelledRef = useRef(false);

  const call = useCallback(async () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Reset error state
    setError(null);
    
    // Set up debounced execution
    timeoutRef.current = setTimeout(async () => {
      if (cancelledRef.current) return;
      
      setLoading(true);
      
      try {
        const result = await apiFunction();
        
        if (!cancelledRef.current) {
          setData(result);
        }
      } catch (err) {
        if (!cancelledRef.current) {
          console.error('Debounced API call failed:', err);
          setError(err instanceof Error ? err : new Error('Unknown error'));
          
          // Optionally retry after a delay for network errors
          if (err instanceof Error && err.message.includes('fetch')) {
            console.log('Network error detected, will retry in 2 seconds...');
            setTimeout(() => {
              if (!cancelledRef.current) {
                call();
              }
            }, 2000);
          }
        }
      } finally {
        if (!cancelledRef.current) {
          setLoading(false);
        }
      }
    }, debounceMs);
  }, [apiFunction, debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { data, loading, error, call };
};
