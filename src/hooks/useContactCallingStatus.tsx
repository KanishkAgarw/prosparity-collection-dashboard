import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { monthToEmiDate } from '@/utils/dateUtils';

export interface ContactStatusData {
  applicant?: string;
  co_applicant?: string;
  guarantor?: string;
  reference?: string;
}

export const useContactCallingStatus = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const fetchContactStatus = useCallback(async (applicationId: string, selectedMonth?: string): Promise<ContactStatusData> => {
    if (!user || !applicationId) return {};
    
    setLoading(true);
    
    try {
      console.log('=== CONTACT STATUS FETCH ===');
      console.log('Application ID:', applicationId);
      console.log('Selected Month:', selectedMonth);

      let query = supabase
        .from('contact_calling_status')
        .select('contact_type, status, created_at')
        .eq('application_id', applicationId);

      // Add month filter if provided - filter by demand_date
      if (selectedMonth) {
        const emiDate = monthToEmiDate(selectedMonth);
        console.log('Filtering by demand_date:', emiDate);
        
        query = query.eq('demand_date', emiDate);
      }

      // Order by created_at to get latest status per contact type
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching contact status:', error);
        return {};
      }

      // Group by contact_type and get the latest status
      const statusData: ContactStatusData = {};
      
      if (data) {
        data.forEach(status => {
          const contactType = status.contact_type.toLowerCase() as keyof ContactStatusData;
          // Only set if we don't already have a status for this contact type (keeps latest due to ordering)
          if (!statusData[contactType]) {
            statusData[contactType] = status.status;
          }
        });
      }

      console.log('✅ Contact status loaded:', statusData);
      return statusData;
    } catch (error) {
      console.error('Error in fetchContactStatus:', error);
      return {};
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateContactStatus = useCallback(async (
    applicationId: string, 
    contactType: string, 
    newStatus: string,
    selectedMonth?: string
  ): Promise<void> => {
    if (!user) return;

    try {
      console.log('=== UPDATING CONTACT STATUS ===');
      console.log('Application ID:', applicationId);
      console.log('Contact Type:', contactType);
      console.log('New Status:', newStatus);
      console.log('Selected Month:', selectedMonth);

      const updateData: any = {
        application_id: applicationId,
        contact_type: contactType,
        status: newStatus,
        user_id: user.id,
        user_email: user.email,
        updated_at: new Date().toISOString()
      };

      // Add demand_date if selectedMonth is provided
      if (selectedMonth) {
        updateData.demand_date = monthToEmiDate(selectedMonth);
      }

      const { error } = await supabase
        .from('contact_calling_status')
        .upsert(updateData, {
          onConflict: 'application_id,contact_type,demand_date'
        });

      if (error) {
        console.error('Error updating contact status:', error);
        throw error;
      }

      console.log('✅ Contact status updated successfully');
    } catch (error) {
      console.error('Error in updateContactStatus:', error);
      throw error;
    }
  }, [user]);

  return {
    fetchContactStatus,
    updateContactStatus,
    loading
  };
};
