
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
  const callIdRef = useRef<number>(0);

  const call = useCallback(async () => {
    // Increment call ID to track which call is current
    const currentCallId = ++callIdRef.current;
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If there's already a loading call, immediately reset loading state
    // This prevents stuck loading spinners when calls are superseded
    if (loading) {
      setLoading(false);
    }

    // Reset error state
    setError(null);
    
    // Set up debounced execution
    timeoutRef.current = setTimeout(async () => {
      // Check if this call has been superseded
      if (cancelledRef.current || currentCallId !== callIdRef.current) {
        return;
      }
      
      setLoading(true);
      
      try {
        const result = await apiFunction();
        
        // Only update state if this is still the current call
        if (!cancelledRef.current && currentCallId === callIdRef.current) {
          setData(result);
        }
      } catch (err) {
        // Only update error state if this is still the current call
        if (!cancelledRef.current && currentCallId === callIdRef.current) {
          console.error('Debounced API call failed:', err);
          setError(err instanceof Error ? err : new Error('Unknown error'));
          
          // Optionally retry after a delay for network errors
          if (err instanceof Error && err.message.includes('fetch')) {
            console.log('Network error detected, will retry in 2 seconds...');
            setTimeout(() => {
              if (!cancelledRef.current && currentCallId === callIdRef.current) {
                call();
              }
            }, 2000);
          }
        }
      } finally {
        // Always reset loading state if this is still the current call
        if (!cancelledRef.current && currentCallId === callIdRef.current) {
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
      // Reset loading state on cleanup
      setLoading(false);
    };
  }, []);

  return { data, loading, error, call };
};
