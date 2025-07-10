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

const CACHE_TTL = 10 * 1000; // Reduced to 10 seconds to prevent stale data
const BATCH_SIZE = 25; // Smaller batch size to reduce partial failures
const cache: FieldStatusCache = {};
const pendingRequests = new Map<string, Promise<Record<string, string>>>();
const requestQueue = new Map<string, { resolve: Function; reject: Function }[]>();

export const useFieldStatusManager = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getCacheKey = useCallback((queryParams: FieldStatusQuery): string => {
    // Simplified cache key generation to reduce complexity
    const sortedIds = [...queryParams.applicationIds].sort();
    const idsKey = sortedIds.length <= 5 ? sortedIds.join(',') : `${sortedIds.length}-${sortedIds[0]}-${sortedIds[sortedIds.length-1]}`;
    return `fs-${queryParams.selectedMonth || 'all'}-${idsKey}`;
  }, []);

  const isValidApplicationId = useCallback((id: any): id is string => {
    return typeof id === 'string' && id.trim().length > 0;
  }, []);

  const fetchFieldStatusChunk = useCallback(async (
    applicationIds: string[], 
    queryParams: FieldStatusQuery,
    retryCount = 0
  ): Promise<Record<string, string>> => {
    if (applicationIds.length === 0) return {};

    const maxRetries = 2;
    try {
      console.log(`📤 Fetching field status chunk: ${applicationIds.length} applications (attempt ${retryCount + 1})`);
      
      let supabaseQuery = supabase
        .from('field_status')
        .select('application_id, status, created_at, demand_date')
        .in('application_id', applicationIds);

      // Add month filtering if specified and not including all months
      if (queryParams.selectedMonth && !queryParams.includeAllMonths) {
        const [year, month] = queryParams.selectedMonth.split('-').map(Number);
        const lastDay = new Date(year, month, 0).getDate();
        const monthStart = `${queryParams.selectedMonth}-01`;
        const monthEnd = `${queryParams.selectedMonth}-${String(lastDay).padStart(2, '0')}`;
        supabaseQuery = supabaseQuery
          .gte('demand_date', monthStart)
          .lte('demand_date', monthEnd);
      }

      // Always order by created_at to get latest status per application
      supabaseQuery = supabaseQuery.order('created_at', { ascending: false });

      const { data, error } = await supabaseQuery;

      if (error) {
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

      // Validate data completeness
      const receivedCount = Object.keys(statusMap).length;
      const expectedCount = applicationIds.length;
      
      if (receivedCount < expectedCount * 0.8 && retryCount < maxRetries) {
        console.warn(`⚠️ Low data completeness: ${receivedCount}/${expectedCount}. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return fetchFieldStatusChunk(applicationIds, queryParams, retryCount + 1);
      }

      console.log(`✅ Chunk processed: ${receivedCount}/${expectedCount} statuses loaded`);
      return statusMap;
    } catch (error) {
      if (retryCount < maxRetries) {
        console.warn(`⚠️ Chunk fetch failed, retrying (${retryCount + 1}/${maxRetries}):`, error);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return fetchFieldStatusChunk(applicationIds, queryParams, retryCount + 1);
      }
      console.error('❌ Chunk fetch error after retries:', error);
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
    
    // Check cache first - stricter validation
    const cached = cache[cacheKey];
    if (cached && Date.now() < cached.expiresAt) {
      const cacheDataCount = Object.keys(cached.data).length;
      const expectedCount = validApplicationIds.length;
      
      // Only use cache if it has reasonable data completeness
      if (cacheDataCount >= expectedCount * 0.8) {
        console.log(`✅ Using cached field status data (${cacheDataCount}/${expectedCount})`);
        return cached.data;
      } else {
        console.warn(`⚠️ Cache data incomplete (${cacheDataCount}/${expectedCount}), refreshing`);
        delete cache[cacheKey];
      }
    }

    // Implement request deduplication with queue
    if (pendingRequests.has(cacheKey)) {
      console.log('⏳ Waiting for pending field status request');
      return new Promise((resolve, reject) => {
        if (!requestQueue.has(cacheKey)) {
          requestQueue.set(cacheKey, []);
        }
        requestQueue.get(cacheKey)!.push({ resolve, reject });
      });
    }

    // Create new request
    const requestPromise = (async (): Promise<Record<string, string>> => {
      try {
        setLoading(true);
        console.log(`🚀 Starting fresh field status fetch for ${validApplicationIds.length} applications`);

        // Chunk the application IDs with smaller batches
        const chunks = chunkArray(validApplicationIds, BATCH_SIZE);
        console.log(`📦 Splitting into ${chunks.length} chunks of max ${BATCH_SIZE} IDs each`);

        // Process chunks sequentially to reduce load and improve consistency
        const combinedStatusMap: Record<string, string> = {};
        let successfulChunks = 0;

        for (let i = 0; i < chunks.length; i++) {
          try {
            const chunkResult = await fetchFieldStatusChunk(chunks[i], queryParams);
            Object.assign(combinedStatusMap, chunkResult);
            successfulChunks++;
            
            // Small delay between chunks to prevent overwhelming the database
            if (i < chunks.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } catch (error) {
            console.error(`❌ Chunk ${i + 1} failed:`, error);
          }
        }

        // Ensure every applicationId has a status; default to 'Unpaid' if missing
        validApplicationIds.forEach(appId => {
          if (!combinedStatusMap[appId]) {
            combinedStatusMap[appId] = 'Unpaid';
          }
        });

        const resultCount = Object.keys(combinedStatusMap).length;
        console.log(`✅ Field status loaded: ${resultCount} applications (${successfulChunks}/${chunks.length} chunks successful)`);

        // Only cache if we have reasonable data completeness
        if (resultCount >= validApplicationIds.length * 0.8) {
          cache[cacheKey] = {
            data: combinedStatusMap,
            timestamp: Date.now(),
            expiresAt: Date.now() + CACHE_TTL
          };
          console.log(`💾 Cached field status data (${resultCount} applications)`);
        } else {
          console.warn(`⚠️ Not caching incomplete data (${resultCount}/${validApplicationIds.length})`);
        }

        // Resolve any queued requests
        const queuedRequests = requestQueue.get(cacheKey) || [];
        queuedRequests.forEach(({ resolve }) => resolve(combinedStatusMap));
        requestQueue.delete(cacheKey);

        return combinedStatusMap;
      } catch (error) {
        console.error('❌ Error in fetchFieldStatus:', error);
        
        // Reject any queued requests
        const queuedRequests = requestQueue.get(cacheKey) || [];
        queuedRequests.forEach(({ reject }) => reject(error));
        requestQueue.delete(cacheKey);
        
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
    pendingRequests.clear();
    requestQueue.clear();
    console.log('🧹 Field status cache, pending requests, and queue cleared');
  }, []);

  return {
    fetchFieldStatus,
    loading,
    clearCache
  };
};