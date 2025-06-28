import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ContactCallingStatus {
  applicant: string;
  co_applicant: string;
  guarantor: string;
  reference: string;
  latest: string;
}

export const useContactCallingStatus = () => {
  const { user } = useAuth();
  const [contactStatuses, setContactStatuses] = useState<ContactCallingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchContactStatuses = useCallback(async (applicationIds: string[]): Promise<Record<string, any>> => {
    if (!user) return {};

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('contact_calling_status')
        .select('*')
        .in('application_id', applicationIds);

      if (error) {
        throw error;
      }

      // Transform the data into a map for easy lookup
      const statusesMap: Record<string, any> = {};
      data.forEach(item => {
        if (!statusesMap[item.application_id]) {
          statusesMap[item.application_id] = {};
        }
        statusesMap[item.application_id][item.contact_type] = item.status;
        statusesMap[item.application_id]['latest'] = item.status;
      });

      setLoading(false);
      return statusesMap;
    } catch (error: any) {
      setError(error);
      setLoading(false);
      return {};
    }
  }, [user]);

  const updateContactStatus = useCallback(async (
    applicationId: string,
    contactType: string,
    newStatus: string,
    demandDate?: string
  ) => {
    if (!user) return;

    try {
      const currentDemandDate = demandDate || new Date().toISOString().split('T')[0];
      
      // Fetch the current status to log the change
      const { data: currentStatusData, error: currentStatusError } = await supabase
        .from('contact_calling_status')
        .select('status')
        .eq('application_id', applicationId)
        .eq('contact_type', contactType)
        .eq('demand_date', currentDemandDate)
        .single();

      if (currentStatusError && currentStatusError.code !== '404') {
        throw currentStatusError;
      }

      const previousStatus = currentStatusData ? currentStatusData.status : 'Not Called';

      // Update or insert the new status
      const { error } = await supabase
        .from('contact_calling_status')
        .upsert({
          application_id: applicationId,
          contact_type: contactType,
          status: newStatus,
          user_id: user.id,
          user_email: user.email || '',
          demand_date: currentDemandDate,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Log the status change
      console.log(`Status updated for ${contactType} of application ${applicationId} from ${previousStatus} to ${newStatus}`);
      
      // Optionally, update the local state or trigger a refetch
      setContactStatuses(prevStatuses => {
        if (!prevStatuses) return null;
        return { ...prevStatuses };
      });

      // Optionally, return success or updated data
      return { success: true, message: 'Contact status updated successfully' };
    } catch (error) {
      console.error('Error updating contact status:', error);
    }
  }, [user]);

  return {
    contactStatuses,
    loading,
    error,
    fetchContactStatuses,
    updateContactStatus
  };
};
