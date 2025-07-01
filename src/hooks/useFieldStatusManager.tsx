
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
const cache: FieldStatusCache = {};
const pendingRequests = new Map<string, Promise<Record<string, string>>>();

export const useFieldStatusManager = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const cancelTokenRef = useRef<boolean>(false);

  const getCacheKey = useCallback((query: FieldStatusQuery): string => {
    const sortedIds = [...query.applicationIds].sort();
    return `field-status-${query.selectedMonth || 'all'}-${query.includeAllMonths ? 'all-months' : 'filtered'}-${sortedIds.join(',')}`;
  }, []);

  const isValidApplicationId = useCallback((id: any): id is string => {
    return typeof id === 'string' && id.trim().length > 0;
  }, []);

  const buildSelectClause = useCallback((): string => {
    const fields = ['application_id', 'status', 'created_at', 'demand_date'];
    return fields.filter(Boolean).join(', ');
  }, []);

  const fetchFieldStatusBatch = useCallback(async (query: FieldStatusQuery): Promise<Record<string, string>> => {
    if (!user) {
      console.warn('❌ No user for field status fetch');
      return {};
    }

    // Validate and filter application IDs
    const validApplicationIds = query.applicationIds.filter(isValidApplicationId);
    if (validApplicationIds.length === 0) {
      console.warn('❌ No valid application IDs provided');
      return {};
    }

    console.log('=== FIELD STATUS MANAGER FETCH ===');
    console.log('Valid Application IDs:', validApplicationIds.length);
    console.log('Selected Month:', query.selectedMonth);
    console.log('Include All Months:', query.includeAllMonths);

    const cacheKey = getCacheKey({ ...query, applicationIds: validApplicationIds });
    
    // Check cache first
    const cached = cache[cacheKey];
    if (cached && Date.now() < cached.expiresAt) {
      console.log('✅ Using cached field status data');
      return cached.data;
    }

    // Check for pending request
    if (pendingRequests.has(cacheKey)) {
      console.log('⏳ Waiting for pending field status request');
      return await pendingRequests.get(cacheKey)!;
    }

    // Create new request
    const requestPromise = (async (): Promise<Record<string, string>> => {
      try {
        let query = supabase
          .from('field_status')
          .select(buildSelectClause())
          .in('application_id', validApplicationIds);

        // Add month filtering if specified and not including all months
        if (query.selectedMonth && !query.includeAllMonths) {
          const monthStart = `${query.selectedMonth}-01`;
          const monthEnd = `${query.selectedMonth}-31`;
          query = query
            .gte('demand_date', monthStart)
            .lte('demand_date', monthEnd);
        }

        // Always order by created_at to get latest status per application
        query = query.order('created_at', { ascending: false });

        console.log('📤 Executing field status query...');
        const { data, error } = await query;

        if (error) {
          console.error('❌ Field status query error:', error);
          throw new Error(`Field status query failed: ${error.message}`);
        }

        if (cancelTokenRef.current) {
          console.log('🛑 Request cancelled');
          return {};
        }

        // Process data - get latest status per application
        const statusMap: Record<string, string> = {};
        const processedApps = new Set<string>();

        data?.forEach(record => {
          if (!processedApps.has(record.application_id)) {
            statusMap[record.application_id] = record.status || 'Unpaid';
            processedApps.add(record.application_id);
          }
        });

        console.log(`✅ Field status loaded: ${Object.keys(statusMap).length} applications`);

        // Cache the result
        cache[cacheKey] = {
          data: statusMap,
          timestamp: Date.now(),
          expiresAt: Date.now() + CACHE_TTL
        };

        return statusMap;
      } catch (error) {
        console.error('❌ Error in fetchFieldStatusBatch:', error);
        // Return empty object instead of throwing to prevent cascade failures
        return {};
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
  }, [user, isValidApplicationId, buildSelectClause, getCacheKey]);

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
