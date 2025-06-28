
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
    if (!user || !applicationIds.length) return {};

    setLoading(true);
    
    try {
      console.log('=== BATCH FETCHING PTP DATES ===');
      console.log('Application IDs:', applicationIds.slice(0, 5), '... and', Math.max(0, applicationIds.length - 5), 'more');
      console.log('Selected Month:', selectedMonth);

      // Build query for batch PTP fetching
      let query = supabase
        .from('ptp_dates')
        .select('application_id, ptp_date, created_at')
        .in('application_id', applicationIds);

      // Add month filtering if selectedMonth is provided
      if (selectedMonth) {
        const monthStart = `${selectedMonth}-01`;
        const nextMonth = new Date(selectedMonth + '-01');
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const monthEnd = nextMonth.toISOString().substring(0, 10);
        
        query = query
          .gte('created_at', monthStart)
          .lt('created_at', monthEnd);
      }

      // Order by most recent
      query = query.order('created_at', { ascending: false });

      const { data: ptpData, error } = await query;

      if (error) {
        console.error('Error batch fetching PTP dates:', error);
        return {};
      }

      if (!ptpData || ptpData.length === 0) {
        console.log('No PTP dates found for applications');
        return {};
      }

      // Get the most recent PTP date for each application
      const ptpMap: Record<string, string | null> = {};
      ptpData.forEach(ptp => {
        if (!ptpMap[ptp.application_id]) {
          ptpMap[ptp.application_id] = ptp.ptp_date;
        }
      });

      console.log('Batch PTP dates result:', Object.keys(ptpMap).length, 'applications have PTP dates');
      return ptpMap;
    } catch (error) {
      console.error('Exception in batch fetchPtpDates:', error);
      return {};
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    loading,
    fetchBatchPtpDates
  };
};
