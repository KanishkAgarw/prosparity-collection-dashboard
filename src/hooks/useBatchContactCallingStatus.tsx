import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface BatchContactStatus {
  applicant: string;
  co_applicant: string;
  guarantor: string;
  reference: string;
}

export const useBatchContactCallingStatus = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const fetchBatchContactStatus = useCallback(async (
    applicationIds: string[], 
    selectedMonth?: string | null
  ): Promise<Record<string, BatchContactStatus>> => {
    if (!user || !applicationIds.length) return {};

    setLoading(true);
    
    try {
      console.log('=== BATCH FETCHING CONTACT CALLING STATUS ===');
      console.log('Application IDs:', applicationIds.slice(0, 5), '... and', Math.max(0, applicationIds.length - 5), 'more');
      console.log('Selected Month:', selectedMonth);

      // Build query for batch contact status fetching
      let query = supabase
        .from('contact_calling_status')
        .select('application_id, contact_type, status, created_at')
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
        console.error('Error batch fetching contact calling status:', error);
        return {};
      }

      if (!statusData || statusData.length === 0) {
        console.log('No contact calling status found for applications');
        return {};
      }

      // Group by application and contact type, keeping most recent
      const statusMap: Record<string, BatchContactStatus> = {};
      
      statusData.forEach(status => {
        if (!statusMap[status.application_id]) {
          statusMap[status.application_id] = {
            applicant: 'Not Called',
            co_applicant: 'Not Called',
            guarantor: 'Not Called',
            reference: 'Not Called'
          };
        }
        
        // Only update if we don't already have a status for this contact type (most recent wins)
        const contactKey = status.contact_type as keyof BatchContactStatus;
        if (statusMap[status.application_id][contactKey] === 'Not Called') {
          statusMap[status.application_id][contactKey] = status.status || 'Not Called';
        }
      });

      console.log('Batch contact status result:', Object.keys(statusMap).length, 'applications have contact status');
      return statusMap;
    } catch (error) {
      console.error('Exception in batch fetchContactStatus:', error);
      return {};
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    loading,
    fetchBatchContactStatus
  };
};
