
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { chunkArray } from '@/utils/batchUtils';

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
const BATCH_SIZE = 50; // Reduced batch size for safety
const cache: FieldStatusCache = {};
const pendingRequests = new Map<string, Promise<Record<string, string>>>();

export const useFieldStatusManager = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

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
        .select('application_id, status, created_at, demand_date')
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

      if (data) {
        data.forEach(record => {
          if (record && record.application_id && record.status) {
            const appId = record.application_id;
            if (!processedApps.has(appId)) {
              statusMap[appId] = record.status || 'Unpaid';
              processedApps.add(appId);
            }
          }
        });
      }

      console.log(`✅ Chunk processed: ${Object.keys(statusMap).length} statuses loaded`);
      return statusMap;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {};
      }
      console.error('Chunk fetch error:', error);
      return {};
    }
  }, []);

  const fetchFieldStatus = useCallback(async (
    applicationIds: string[], 
    selectedMonth?: string | null,
    includeAllMonths = false
  ): Promise<Record<string, string>> => {
    if (!user || applicationIds.length === 0) {
      console.log('❌ No user or empty application IDs');
      return {};
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    // Validate and filter application IDs
    const validApplicationIds = applicationIds.filter(isValidApplicationId);
    if (validApplicationIds.length === 0) {
      console.warn('❌ No valid application IDs provided');
      return {};
    }

    console.log('=== FIELD STATUS MANAGER FETCH ===');
    console.log('Valid Application IDs:', validApplicationIds.length);
    console.log('Selected Month:', selectedMonth);

    const queryParams: FieldStatusQuery = {
      applicationIds: validApplicationIds,
      selectedMonth,
      includeAllMonths
    };

    const cacheKey = getCacheKey(queryParams);
    
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
        pendingRequests.delete(cacheKey);
      }
    }

    // Create new request
    const requestPromise = (async (): Promise<Record<string, string>> => {
      try {
        setLoading(true);

        // Chunk the application IDs to avoid URL length issues
        const chunks = chunkArray(validApplicationIds, BATCH_SIZE);
        console.log(`📦 Splitting into ${chunks.length} chunks of max ${BATCH_SIZE} IDs each`);

        const chunkPromises = chunks.map(chunk => 
          fetchFieldStatusChunk(chunk, queryParams, abortControllerRef.current!)
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
          }
        });

        if (successfulChunks === 0) {
          throw new Error('All chunks failed to load');
        }

        console.log(`✅ Field status loaded: ${Object.keys(combinedStatusMap).length} applications (${successfulChunks}/${chunks.length} chunks successful)`);

        // Cache the result
        cache[cacheKey] = {
          data: combinedStatusMap,
          timestamp: Date.now(),
          expiresAt: Date.now() + CACHE_TTL
        };

        return combinedStatusMap;
      } catch (error) {
        console.error('❌ Error in fetchFieldStatus:', error);
        return {};
      } finally {
        setLoading(false);
      }
    })();

    // Store pending request
    pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  }, [user, isValidApplicationId, getCacheKey, fetchFieldStatusChunk]);

  const clearCache = useCallback(() => {
    Object.keys(cache).forEach(key => delete cache[key]);
    console.log('🧹 Field status cache cleared');
  }, []);

  return {
    fetchFieldStatus,
    loading,
    clearCache
  };
};
