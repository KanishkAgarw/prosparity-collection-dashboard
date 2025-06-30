
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getMonthDateRange } from '@/utils/dateUtils';

export const useBatchFieldStatus = () => {
  const [loading, setLoading] = useState(false);

  const fetchBatchFieldStatus = useCallback(async (
    applicationIds: string[], 
    selectedEmiMonth?: string | null
  ): Promise<Record<string, string>> => {
    if (applicationIds.length === 0) return {};

    setLoading(true);
    try {
      console.log('=== FETCHING BATCH FIELD STATUS ===');
      console.log('Application IDs:', applicationIds.length);
      console.log('Selected EMI Month:', selectedEmiMonth);

      let query = supabase
        .from('field_status')
        .select('application_id, status, created_at, demand_date')
        .in('application_id', applicationIds)
        .order('created_at', { ascending: false });

      // If EMI month is selected, filter by demand_date to get month-specific status
      if (selectedEmiMonth) {
        const { start, end } = getMonthDateRange(selectedEmiMonth);
        console.log('Filtering field status by demand_date:', start, 'to', end);
        
        query = query
          .gte('demand_date', start)
          .lte('demand_date', end);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching batch field status:', error);
        return {};
      }

      console.log(`Found ${data?.length || 0} field status records`);

      // Group by application_id and get the latest status for each
      const statusMap: Record<string, string> = {};
      
      data?.forEach(record => {
        if (!statusMap[record.application_id]) {
          statusMap[record.application_id] = record.status;
          console.log(`Status for ${record.application_id}: ${record.status}`);
        }
      });

      console.log('Final status map:', Object.keys(statusMap).length, 'applications');
      return statusMap;

    } catch (error) {
      console.error('Error in fetchBatchFieldStatus:', error);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    fetchBatchFieldStatus
  };
};
