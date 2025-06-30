
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getMonthDateRange } from '@/utils/dateUtils';

export const useBatchPtpDates = () => {
  const [loading, setLoading] = useState(false);

  const fetchBatchPtpDates = useCallback(async (
    applicationIds: string[], 
    selectedEmiMonth?: string | null
  ): Promise<Record<string, string | null>> => {
    if (applicationIds.length === 0) return {};

    setLoading(true);
    try {
      console.log('=== FETCHING BATCH PTP DATES ===');
      console.log('Application IDs:', applicationIds.length);
      console.log('Selected EMI Month:', selectedEmiMonth);

      let query = supabase
        .from('ptp_dates')
        .select('application_id, ptp_date, created_at, demand_date')
        .in('application_id', applicationIds)
        .order('created_at', { ascending: false });

      // If EMI month is selected, filter by demand_date to get month-specific PTP dates
      if (selectedEmiMonth) {
        const { start, end } = getMonthDateRange(selectedEmiMonth);
        console.log('Filtering PTP dates by demand_date:', start, 'to', end);
        
        query = query
          .gte('demand_date', start)
          .lte('demand_date', end);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching batch PTP dates:', error);
        return {};
      }

      console.log(`Found ${data?.length || 0} PTP date records`);

      // Group by application_id and get the latest PTP date for each
      const ptpMap: Record<string, string | null> = {};
      
      data?.forEach(record => {
        if (!ptpMap.hasOwnProperty(record.application_id)) {
          ptpMap[record.application_id] = record.ptp_date;
          console.log(`PTP date for ${record.application_id}: ${record.ptp_date}`);
        }
      });

      console.log('Final PTP map:', Object.keys(ptpMap).length, 'applications');
      return ptpMap;

    } catch (error) {
      console.error('Error in fetchBatchPtpDates:', error);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    fetchBatchPtpDates
  };
};
