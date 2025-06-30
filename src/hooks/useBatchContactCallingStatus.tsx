
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getMonthDateRange } from '@/utils/dateUtils';

export interface ContactStatusInfo {
  status: string;
  updatedAt?: string;
}

export interface BatchContactStatus {
  applicant?: ContactStatusInfo;
  coApplicant?: ContactStatusInfo;
  guarantor?: ContactStatusInfo;
  reference?: ContactStatusInfo;
  calling_status?: string;
  contact_type?: string;
}

export const useBatchContactCallingStatus = () => {
  const [loading, setLoading] = useState(false);

  const fetchBatchContactStatus = useCallback(async (
    applicationIds: string[], 
    selectedEmiMonth?: string | null
  ): Promise<Record<string, BatchContactStatus>> => {
    if (applicationIds.length === 0) return {};

    setLoading(true);
    try {
      console.log('=== FETCHING BATCH CONTACT CALLING STATUS ===');
      console.log('Application IDs:', applicationIds.length);
      console.log('Selected EMI Month:', selectedEmiMonth);

      let query = supabase
        .from('contact_calling_status')
        .select('application_id, contact_type, status, updated_at, demand_date')
        .in('application_id', applicationIds)
        .order('updated_at', { ascending: false });

      // If EMI month is selected, filter by demand_date to get month-specific calling status
      if (selectedEmiMonth) {
        const { start, end } = getMonthDateRange(selectedEmiMonth);
        console.log('Filtering contact calling status by demand_date:', start, 'to', end);
        
        query = query
          .gte('demand_date', start)
          .lte('demand_date', end);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching batch contact calling status:', error);
        return {};
      }

      console.log(`Found ${data?.length || 0} contact calling status records`);

      // Group by application_id and contact_type, get the latest status for each
      const contactMap: Record<string, BatchContactStatus> = {};
      
      data?.forEach(record => {
        if (!contactMap[record.application_id]) {
          contactMap[record.application_id] = {};
        }

        const contactType = record.contact_type.toLowerCase().replace(/[^a-z]/g, '');
        const key = contactType === 'coapplicant' ? 'coApplicant' : 
                   contactType === 'applicant' ? 'applicant' :
                   contactType === 'guarantor' ? 'guarantor' : 'reference';

        if (!contactMap[record.application_id][key as keyof BatchContactStatus]) {
          contactMap[record.application_id][key as keyof BatchContactStatus] = {
            status: record.status,
            updatedAt: record.updated_at
          } as ContactStatusInfo;
        }

        // Set the primary calling status (use the latest one)
        if (!contactMap[record.application_id].calling_status) {
          contactMap[record.application_id].calling_status = record.status;
          contactMap[record.application_id].contact_type = record.contact_type;
        }
      });

      console.log('Final contact status map:', Object.keys(contactMap).length, 'applications');
      return contactMap;

    } catch (error) {
      console.error('Error in fetchBatchContactStatus:', error);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    fetchBatchContactStatus
  };
};
