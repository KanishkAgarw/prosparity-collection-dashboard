
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
  const currentCallIdRef = useRef<number>(0);

  const call = useCallback(async () => {
    // Generate a unique ID for this call
    const callId = ++currentCallIdRef.current;
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Reset error state immediately
    setError(null);
    
    // If we're already loading, immediately reset loading state
    // This prevents the spinner from getting stuck when calls are superseded
    if (loading) {
      setLoading(false);
    }
    
    // Set up debounced execution
    timeoutRef.current = setTimeout(async () => {
      // Check if this call is still the current one
      if (cancelledRef.current || callId !== currentCallIdRef.current) {
        return;
      }
      
      setLoading(true);
      
      try {
        const result = await apiFunction();
        
        // Only update state if this is still the current call
        if (!cancelledRef.current && callId === currentCallIdRef.current) {
          setData(result);
        }
      } catch (err) {
        // Only update error state if this is still the current call
        if (!cancelledRef.current && callId === currentCallIdRef.current) {
          console.error('Debounced API call failed:', err);
          setError(err instanceof Error ? err : new Error('Unknown error'));
          
          // Optionally retry after a delay for network errors
          if (err instanceof Error && err.message.includes('fetch')) {
            console.log('Network error detected, will retry in 2 seconds...');
            setTimeout(() => {
              if (!cancelledRef.current && callId === currentCallIdRef.current) {
                call();
              }
            }, 2000);
          }
        }
      } finally {
        // Always reset loading state if this is still the current call
        if (!cancelledRef.current && callId === currentCallIdRef.current) {
          setLoading(false);
        }
      }
    }, debounceMs);
  }, [apiFunction, debounceMs, loading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Ensure loading is reset on cleanup
      setLoading(false);
    };
  }, []);

  return { data, loading, error, call };
};
