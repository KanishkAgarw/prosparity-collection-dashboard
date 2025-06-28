
import { useRef, useCallback } from 'react';

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

export const useRequestDeduplication = () => {
  const pendingRequests = useRef<Map<string, PendingRequest>>(new Map());

  const deduplicateRequest = useCallback(async <T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number = 5000
  ): Promise<T> => {
    const now = Date.now();
    const existing = pendingRequests.current.get(key);

    // If we have a pending request that's not too old, return it
    if (existing && (now - existing.timestamp) < ttl) {
      return existing.promise;
    }

    // Create new request
    const promise = requestFn().finally(() => {
      // Clean up after request completes
      pendingRequests.current.delete(key);
    });

    pendingRequests.current.set(key, {
      promise,
      timestamp: now
    });

    // Clean up old requests
    for (const [reqKey, req] of pendingRequests.current.entries()) {
      if (now - req.timestamp > ttl) {
        pendingRequests.current.delete(reqKey);
      }
    }

    return promise;
  }, []);

  const clearPendingRequests = useCallback(() => {
    pendingRequests.current.clear();
  }, []);

  return {
    deduplicateRequest,
    clearPendingRequests
  };
};
