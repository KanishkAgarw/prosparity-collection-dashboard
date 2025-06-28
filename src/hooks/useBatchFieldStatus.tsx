
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useBatchFieldStatus = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const fetchBatchFieldStatus = useCallback(async (
    applicationIds: string[], 
    selectedMonth?: string | null
  ): Promise<Record<string, string>> => {
    if (!user || !applicationIds.length) return {};

    setLoading(true);
    
    try {
      console.log('=== BATCH FETCHING FIELD STATUS ===');
      console.log('Application IDs:', applicationIds.slice(0, 5), '... and', Math.max(0, applicationIds.length - 5), 'more');
      console.log('Selected Month:', selectedMonth);

      // Build query for batch status fetching
      let query = supabase
        .from('field_status')
        .select('application_id, status, created_at')
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

      const { data: statusData, error } = await query;

      if (error) {
        console.error('Error batch fetching field status:', error);
        return {};
      }

      if (!statusData || statusData.length === 0) {
        console.log('No field status found for applications');
        return {};
      }

      // Get the most recent status for each application
      const statusMap: Record<string, string> = {};
      statusData.forEach(status => {
        if (!statusMap[status.application_id]) {
          statusMap[status.application_id] = status.status || 'Unpaid';
        }
      });

      console.log('Batch field status result:', Object.keys(statusMap).length, 'applications have status');
      return statusMap;
    } catch (error) {
      console.error('Exception in batch fetchFieldStatus:', error);
      return {};
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    loading,
    fetchBatchFieldStatus
  };
};
