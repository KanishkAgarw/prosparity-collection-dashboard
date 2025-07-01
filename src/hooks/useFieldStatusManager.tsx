
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { chunkArray, BATCH_SIZE } from '@/utils/batchUtils';

interface FieldStatusQuery {
  applicationIds: string[];
  selectedMonth?: string | null;
  includeAllMonths?: boolean;
}

interface FieldStatusCache {
  [key: string]: {
    data: Record<string, string>;
    timestamp: number;
    expiresAt: number;
  };
}

const CACHE_TTL = 30 * 1000; // 30 seconds
const MAX_URL_LENGTH = 2000; // Safe URL length limit
const cache: FieldStatusCache = {};
const pendingRequests = new Map<string, Promise<Record<string, string>>>();
const requestCancelTokens = new Map<string, AbortController>();

// Circuit breaker state
let circuitBreakerOpen = false;
let lastFailureTime = 0;
const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds
const FAILURE_THRESHOLD = 3;
let consecutiveFailures = 0;

export const useFieldStatusManager = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const cancelTokenRef = useRef<boolean>(false);

  const getCacheKey = useCallback((queryParams: FieldStatusQuery): string => {
    const sortedIds = [...queryParams.applicationIds].sort();
    const idsHash = sortedIds.length > 10 ? 
      `${sortedIds.length}-${sortedIds[0]}-${sortedIds[sortedIds.length-1]}` : 
      sortedIds.join(',');
    return `field-status-${queryParams.selectedMonth || 'all'}-${queryParams.includeAllMonths ? 'all-months' : 'filtered'}-${idsHash}`;
  }, []);

  const isValidApplicationId = useCallback((id: any): id is string => {
    return typeof id === 'string' && id.trim().length > 0;
  }, []);

  const buildSelectClause = useCallback((): string => {
    const fields = ['application_id', 'status', 'created_at', 'demand_date'];
    return fields.filter(Boolean).join(', ');
  }, []);

  const checkCircuitBreaker = useCallback((): boolean => {
    if (circuitBreakerOpen) {
      const now = Date.now();
      if (now - lastFailureTime > CIRCUIT_BREAKER_TIMEOUT) {
        console.log('🔄 Circuit breaker reset - attempting requests again');
        circuitBreakerOpen = false;
        consecutiveFailures = 0;
        return false;
      }
      console.log('🚫 Circuit breaker is open - blocking requests');
      return true;
    }
    return false;
  }, []);

  const handleRequestFailure = useCallback((error: any) => {
    consecutiveFailures++;
    lastFailureTime = Date.now();
    
    if (consecutiveFailures >= FAILURE_THRESHOLD) {
      circuitBreakerOpen = true;
      console.log('🔥 Circuit breaker opened due to consecutive failures');
    }
    
    console.error('❌ Request failed:', error);
  }, []);

  const handleRequestSuccess = useCallback(() => {
    consecutiveFailures = 0;
    if (circuitBreakerOpen) {
      circuitBreakerOpen = false;
      console.log('✅ Circuit breaker closed after successful request');
    }
  }, []);

  const fetchFieldStatusChunk = useCallback(async (
    applicationIds: string[], 
    queryParams: FieldStatusQuery,
    abortController: AbortController
  ): Promise<Record<string, string>> => {
    if (applicationIds.length === 0) return {};

    try {
      console.log(`📤 Fetching field status chunk: ${applicationIds.length} applications`);
      
      let supabaseQuery = supabase
        .from('field_status')
        .select(buildSelectClause())
        .in('application_id', applicationIds)
        .abortSignal(abortController.signal);

      // Add month filtering if specified and not including all months
      if (queryParams.selectedMonth && !queryParams.includeAllMonths) {
        const monthStart = `${queryParams.selectedMonth}-01`;
        const monthEnd = `${queryParams.selectedMonth}-31`;
        supabaseQuery = supabaseQuery
          .gte('demand_date', monthStart)
          .lte('demand_date', monthEnd);
      }

      // Always order by created_at to get latest status per application
      supabaseQuery = supabaseQuery.order('created_at', { ascending: false });

      const { data, error } = await supabaseQuery;

      if (error) {
        if (error.name === 'AbortError') {
          console.log('🛑 Request was cancelled');
          return {};
        }
        throw new Error(`Field status query failed: ${error.message}`);
      }

      // Process data - get latest status per application
      const statusMap: Record<string, string> = {};
      const processedApps = new Set<string>();

      data?.forEach(record => {
        if (record && typeof record === 'object') {
          const typedRecord = record as { application_id?: string; status?: string };
          
          if (typedRecord.application_id && typedRecord.status) {
            const appId = typedRecord.application_id;
            if (!processedApps.has(appId)) {
              statusMap[appId] = typedRecord.status || 'Unpaid';
              processedApps.add(appId);
            }
          }
        }
      });

      console.log(`✅ Chunk processed: ${Object.keys(statusMap).length} statuses loaded`);
      return statusMap;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {};
      }
      throw error;
    }
  }, [buildSelectClause]);

  const fetchFieldStatusBatch = useCallback(async (queryParams: FieldStatusQuery): Promise<Record<string, string>> => {
    if (!user) {
      console.warn('❌ No user for field status fetch');
      return {};
    }

    // Check circuit breaker
    if (checkCircuitBreaker()) {
      return {};
    }

    // Validate and filter application IDs
    const validApplicationIds = queryParams.applicationIds.filter(isValidApplicationId);
    if (validApplicationIds.length === 0) {
      console.warn('❌ No valid application IDs provided');
      return {};
    }

    console.log('=== FIELD STATUS MANAGER FETCH ===');
    console.log('Valid Application IDs:', validApplicationIds.length);
    console.log('Selected Month:', queryParams.selectedMonth);
    console.log('Include All Months:', queryParams.includeAllMonths);

    const cacheKey = getCacheKey({ ...queryParams, applicationIds: validApplicationIds });
    
    // Check cache first
    const cached = cache[cacheKey];
    if (cached && Date.now() < cached.expiresAt) {
      console.log('✅ Using cached field status data');
      return cached.data;
    }

    // Check for pending request
    if (pendingRequests.has(cacheKey)) {
      console.log('⏳ Waiting for pending field status request');
      try {
        return await pendingRequests.get(cacheKey)!;
      } catch (error) {
        // If pending request failed, continue with new request
        pendingRequests.delete(cacheKey);
      }
    }

    // Create abort controller for this request
    const abortController = new AbortController();
    requestCancelTokens.set(cacheKey, abortController);

    // Create new request
    const requestPromise = (async (): Promise<Record<string, string>> => {
      try {
        // Chunk the application IDs to avoid URL length issues
        const chunks = chunkArray(validApplicationIds, BATCH_SIZE);
        console.log(`📦 Splitting into ${chunks.length} chunks of max ${BATCH_SIZE} IDs each`);

        const chunkPromises = chunks.map(chunk => 
          fetchFieldStatusChunk(chunk, queryParams, abortController)
        );

        const chunkResults = await Promise.allSettled(chunkPromises);
        
        // Combine results from all chunks
        const combinedStatusMap: Record<string, string> = {};
        let successfulChunks = 0;

        chunkResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            Object.assign(combinedStatusMap, result.value);
            successfulChunks++;
          } else {
            console.error(`❌ Chunk ${index + 1} failed:`, result.reason);
            handleRequestFailure(result.reason);
          }
        });

        if (successfulChunks === 0) {
          throw new Error('All chunks failed to load');
        }

        if (cancelTokenRef.current) {
          console.log('🛑 Request cancelled');
          return {};
        }

        console.log(`✅ Field status loaded: ${Object.keys(combinedStatusMap).length} applications (${successfulChunks}/${chunks.length} chunks successful)`);

        // Cache the result
        cache[cacheKey] = {
          data: combinedStatusMap,
          timestamp: Date.now(),
          expiresAt: Date.now() + CACHE_TTL
        };

        handleRequestSuccess();
        return combinedStatusMap;
      } catch (error) {
        console.error('❌ Error in fetchFieldStatusBatch:', error);
        handleRequestFailure(error);
        
        // Return empty object instead of throwing to prevent cascade failures
        return {};
      } finally {
        // Clean up abort controller
        requestCancelTokens.delete(cacheKey);
      }
    })();

    // Store pending request
    pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up pending request
      pendingRequests.delete(cacheKey);
    }
  }, [user, isValidApplicationId, buildSelectClause, getCacheKey, fetchFieldStatusChunk, checkCircuitBreaker, handleRequestFailure, handleRequestSuccess]);

  const fetchFieldStatus = useCallback(async (
    applicationIds: string[], 
    selectedMonth?: string | null,
    includeAllMonths = false
  ): Promise<Record<string, string>> => {
    if (applicationIds.length === 0) return {};

    setLoading(true);
    cancelTokenRef.current = false;

    try {
      const result = await fetchFieldStatusBatch({
        applicationIds,
        selectedMonth,
        includeAllMonths
      });
      return result;
    } finally {
      if (!cancelTokenRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFieldStatusBatch]);

  const cancelRequest = useCallback(() => {
    cancelTokenRef.current = true;
    setLoading(false);
    
    // Cancel all pending requests
    requestCancelTokens.forEach((controller) => {
      controller.abort();
    });
    requestCancelTokens.clear();
    pendingRequests.clear();
  }, []);

  const clearCache = useCallback(() => {
    Object.keys(cache).forEach(key => delete cache[key]);
    console.log('🧹 Field status cache cleared');
  }, []);

  return {
    fetchFieldStatus,
    loading,
    cancelRequest,
    clearCache
  };
};
