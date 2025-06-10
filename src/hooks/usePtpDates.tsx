
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PtpDate } from '@/types/database';

export const usePtpDates = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const fetchPtpDate = useCallback(async (applicationId: string): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('ptp_dates')
        .select('ptp_date')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching PTP date:', error);
        return null;
      }

      return data?.ptp_date || null;
    } catch (error) {
      console.error('Error fetching PTP date:', error);
      return null;
    }
  }, [user]);

  const fetchPtpDates = useCallback(async (applicationIds: string[]): Promise<Record<string, string>> => {
    if (!user || applicationIds.length === 0) return {};
    
    try {
      const { data, error } = await supabase
        .from('ptp_dates')
        .select('application_id, ptp_date, created_at')
        .in('application_id', applicationIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching PTP dates:', error);
        return {};
      }

      // Get the latest PTP date for each application
      const ptpMap: Record<string, string> = {};
      data?.forEach(ptp => {
        if (ptp.ptp_date && !ptpMap[ptp.application_id]) {
          ptpMap[ptp.application_id] = ptp.ptp_date;
        }
      });

      return ptpMap;
    } catch (error) {
      console.error('Error fetching PTP dates:', error);
      return {};
    }
  }, [user]);

  const updatePtpDate = useCallback(async (applicationId: string, ptpDate: string | null) => {
    if (!user) {
      console.error('PTP Update Failed: User not authenticated');
      return false;
    }

    console.log('=== PTP UPDATE ATTEMPT ===');
    console.log('Application ID:', applicationId);
    console.log('User ID:', user.id);
    console.log('New PTP Date:', ptpDate);

    setLoading(true);
    try {
      // Validate input
      if (!applicationId || applicationId.trim() === '') {
        console.error('PTP Update Failed: Invalid application ID');
        return false;
      }

      // Validate date format if provided
      if (ptpDate) {
        const parsedDate = new Date(ptpDate);
        if (isNaN(parsedDate.getTime())) {
          console.error('PTP Update Failed: Invalid date format:', ptpDate);
          return false;
        }
      }

      console.log('Attempting to insert PTP date record...');
      
      // Insert the PTP date record with retry logic
      let insertAttempts = 0;
      const maxRetries = 3;
      let insertSuccess = false;

      while (insertAttempts < maxRetries && !insertSuccess) {
        insertAttempts++;
        console.log(`PTP Insert attempt ${insertAttempts}/${maxRetries}`);

        const { error: insertError } = await supabase
          .from('ptp_dates')
          .insert({
            application_id: applicationId,
            ptp_date: ptpDate,
            user_id: user.id
          });

        if (insertError) {
          console.error(`PTP Insert attempt ${insertAttempts} failed:`, insertError);
          if (insertAttempts < maxRetries) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } else {
          console.log(`PTP Insert successful on attempt ${insertAttempts}`);
          insertSuccess = true;
        }
      }

      if (!insertSuccess) {
        console.error('PTP Update Failed: All insert attempts failed');
        return false;
      }

      console.log('PTP date record inserted successfully');
      return true;

    } catch (error) {
      console.error('PTP Update Failed: Unexpected error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    fetchPtpDate,
    fetchPtpDates,
    updatePtpDate,
    loading
  };
};
