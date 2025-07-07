
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { chunkArray } from '@/utils/batchUtils';

interface CollectionStatusQuery {
  applicationIds: string[];
  selectedMonth?: string | null;
}

interface CollectionStatusCache {
  [key: string]: {
    data: Record<string, string>;
    timestamp: number;
    expiresAt: number;
  };
}

const CACHE_TTL = 30 * 1000; // 30 seconds
const BATCH_SIZE = 50;
const cache: CollectionStatusCache = {};
const pendingRequests = new Map<string, Promise<Record<string, string>>>();

export const useCollectionStatusManager = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getCacheKey = useCallback((queryParams: CollectionStatusQuery): string => {
    const sortedIds = [...queryParams.applicationIds].sort();
    const idsHash = sortedIds.length > 10 ? 
      `${sortedIds.length}-${sortedIds[0]}-${sortedIds[sortedIds.length-1]}` : 
      sortedIds.join(',');
    return `collection-status-${queryParams.selectedMonth || 'all'}-${idsHash}`;
  }, []);

  const fetchCollectionStatusChunk = useCallback(async (
    applicationIds: string[], 
    queryParams: CollectionStatusQuery,
    abortController: AbortController
  ): Promise<Record<string, string>> => {
    if (applicationIds.length === 0) return {};

    try {
      console.log(`📤 Fetching collection status chunk: ${applicationIds.length} applications`);
      
      let supabaseQuery = supabase
        .from('collection')
        .select('application_id, lms_status, demand_date')
        .in('application_id', applicationIds)
        .abortSignal(abortController.signal);

      // Add month filtering if specified
      if (queryParams.selectedMonth) {
        const [year, month] = queryParams.selectedMonth.split('-').map(Number);
        const lastDay = new Date(year, month, 0).getDate();
        const monthStart = `${queryParams.selectedMonth}-01`;
        const monthEnd = `${queryParams.selectedMonth}-${String(lastDay).padStart(2, '0')}`;
        supabaseQuery = supabaseQuery
          .gte('demand_date', monthStart)
          .lte('demand_date', monthEnd);
      }

      supabaseQuery = supabaseQuery.order('created_at', { ascending: false });

      const { data, error } = await supabaseQuery;

      if (error) {
        if (error.name === 'AbortError') {
          console.log('🛑 Collection status request was cancelled');
          return {};
        }
        throw new Error(`Collection status query failed: ${error.message}`);
      }

      // Process data - get latest status per application
      const statusMap: Record<string, string> = {};
      const processedApps = new Set<string>();

      if (data) {
        data.forEach(record => {
          if (record && record.application_id && record.lms_status) {
            const appId = record.application_id;
            if (!processedApps.has(appId)) {
              statusMap[appId] = record.lms_status;
              processedApps.add(appId);
            }
          }
        });
      }

      console.log(`✅ Collection status chunk processed: ${Object.keys(statusMap).length} statuses loaded`);
      return statusMap;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {};
      }
      console.error('Collection status chunk fetch error:', error);
      return {};
    }
  }, []);

  const fetchCollectionStatus = useCallback(async (
    applicationIds: string[], 
    selectedMonth?: string | null
  ): Promise<Record<string, string>> => {
    if (!user || applicationIds.length === 0) {
      console.log('❌ No user or empty application IDs for collection status');
      return {};
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    // Validate application IDs
    const validApplicationIds = applicationIds.filter(id => typeof id === 'string' && id.trim().length > 0);
    if (validApplicationIds.length === 0) {
      console.warn('❌ No valid application IDs provided for collection status');
      return {};
    }

    console.log('=== COLLECTION STATUS MANAGER FETCH ===');
    console.log('Valid Application IDs:', validApplicationIds.length);
    console.log('Selected Month:', selectedMonth);

    const queryParams: CollectionStatusQuery = {
      applicationIds: validApplicationIds,
      selectedMonth
    };

    const cacheKey = getCacheKey(queryParams);
    
    // Check cache first
    const cached = cache[cacheKey];
    if (cached && Date.now() < cached.expiresAt) {
      console.log('✅ Using cached collection status data');
      return cached.data;
    }

    // Check for pending request
    if (pendingRequests.has(cacheKey)) {
      console.log('⏳ Waiting for pending collection status request');
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

        // Chunk the application IDs
        const chunks = chunkArray(validApplicationIds, BATCH_SIZE);
        console.log(`📦 Splitting collection status into ${chunks.length} chunks of max ${BATCH_SIZE} IDs each`);

        const chunkPromises = chunks.map(chunk => 
          fetchCollectionStatusChunk(chunk, queryParams, abortControllerRef.current!)
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
            console.error(`❌ Collection status chunk ${index + 1} failed:`, result.reason);
          }
        });

        if (successfulChunks === 0) {
          throw new Error('All collection status chunks failed to load');
        }

        console.log(`✅ Collection status loaded: ${Object.keys(combinedStatusMap).length} applications (${successfulChunks}/${chunks.length} chunks successful)`);

        // Cache the result
        cache[cacheKey] = {
          data: combinedStatusMap,
          timestamp: Date.now(),
          expiresAt: Date.now() + CACHE_TTL
        };

        return combinedStatusMap;
      } catch (error) {
        console.error('❌ Error in fetchCollectionStatus:', error);
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
  }, [user, getCacheKey, fetchCollectionStatusChunk]);

  const clearCache = useCallback(() => {
    Object.keys(cache).forEach(key => delete cache[key]);
    console.log('🧹 Collection status cache cleared');
  }, []);

  return {
    fetchCollectionStatus,
    loading,
    clearCache
  };
};
