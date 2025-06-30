
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getMonthDateRange } from '@/utils/dateUtils';

export const useBatchFieldStatus = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const fetchBatchFieldStatus = useCallback(async (
    applicationIds: string[], 
    selectedMonth?: string | null
  ): Promise<Record<string, { status: string; callingStatus?: string }>> => {
    if (!user || applicationIds.length === 0) return {};
    
    setLoading(true);
    
    try {
      console.log('=== BATCH FIELD STATUS FETCH ===');
      console.log('Application IDs:', applicationIds.length);
      console.log('Selected Month:', selectedMonth);

      let query = supabase
        .from('field_status')
        .select('application_id, status, calling_status, created_at')
        .in('application_id', applicationIds);

      // Add month filter if provided - filter by demand_date using proper date range
      if (selectedMonth) {
        const { start, end } = getMonthDateRange(selectedMonth);
        console.log('Date range for field status:', { start, end });
        
        query = query
          .gte('demand_date', start)
          .lte('demand_date', end);
      }

      // Order by created_at to get latest status per application
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching batch field status:', error);
        // Return empty object instead of throwing to prevent cascade failures
        return {};
      }

      // Group by application_id and get the latest status
      const statusMap: Record<string, { status: string; callingStatus?: string }> = {};
      
      if (data) {
        data.forEach(status => {
          // Only set if we don't already have a status for this application (keeps latest due to ordering)
          if (!statusMap[status.application_id]) {
            statusMap[status.application_id] = {
              status: status.status,
              callingStatus: status.calling_status || undefined
            };
          }
        });
      }

      console.log('✅ Batch field status loaded:', Object.keys(statusMap).length, 'applications');
      return statusMap;
    } catch (error) {
      console.error('Error in fetchBatchFieldStatus:', error);
      return {}; // Return empty object to prevent cascade failures
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    fetchBatchFieldStatus,
    loading
  };
};
