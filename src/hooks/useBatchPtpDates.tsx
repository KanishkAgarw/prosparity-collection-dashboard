import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useBatchPtpDates = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const fetchBatchPtpDates = useCallback(async (
    applicationIds: string[], 
    selectedMonth?: string | null
  ): Promise<Record<string, string | null>> => {
    if (!user || applicationIds.length === 0) return {};
    
    setLoading(true);
    
    try {
      console.log('=== BATCH PTP DATES FETCH ===');
      console.log('Application IDs:', applicationIds.length);
      console.log('Selected Month:', selectedMonth);

      let query = supabase
        .from('ptp_dates')
        .select('application_id, ptp_date, created_at')
        .in('application_id', applicationIds);

      // Add month filter if provided
      if (selectedMonth) {
        query = query.eq('demand_date', selectedMonth);
      }

      // Order by created_at to get latest PTP date per application
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching batch PTP dates:', error);
        // Return empty object instead of throwing to prevent cascade failures
        return {};
      }

      // Group by application_id and get the latest PTP date
      const ptpMap: Record<string, string | null> = {};
      
      if (data) {
        data.forEach(ptp => {
          // Only set if we don't already have a PTP date for this application (keeps latest due to ordering)
          if (!ptpMap.hasOwnProperty(ptp.application_id)) {
            ptpMap[ptp.application_id] = ptp.ptp_date;
          }
        });
      }

      console.log('✅ Batch PTP dates loaded:', Object.keys(ptpMap).length, 'applications');
      return ptpMap;
    } catch (error) {
      console.error('Error in fetchBatchPtpDates:', error);
      return {}; // Return empty object to prevent cascade failures
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    fetchBatchPtpDates,
    loading
  };
};
