
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

      // Return the ptp_date value directly - could be a date string or null
      return data?.ptp_date || null;
    } catch (error) {
      console.error('Error fetching PTP date:', error);
      return null;
    }
  }, [user]);

  const fetchPtpDates = useCallback(async (applicationIds: string[]): Promise<Record<string, string | null>> => {
    if (!user || applicationIds.length === 0) return {};
    
    try {
      console.log('🔄 Fetching PTP dates for', applicationIds.length, 'applications');
      
      // Get ALL latest records per application, including those with null ptp_date
      const { data, error } = await supabase
        .from('ptp_dates')
        .select('application_id, ptp_date, created_at')
        .in('application_id', applicationIds)
        .order('application_id', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching PTP dates:', error);
        return {};
      }

      // Get the latest record for each application (including null ptp_date)
      const ptpMap: Record<string, string | null> = {};
      const processedApps = new Set<string>();
      
      data?.forEach(ptp => {
        if (!processedApps.has(ptp.application_id)) {
          // Store the latest ptp_date for this application (could be null for cleared dates)
          ptpMap[ptp.application_id] = ptp.ptp_date;
          processedApps.add(ptp.application_id);
        }
      });

      console.log('✅ Fetched PTP dates:', Object.keys(ptpMap).length, 'applications processed');
      console.log('📅 Applications with actual dates:', Object.values(ptpMap).filter(date => date !== null).length);
      console.log('🚫 Applications with cleared dates:', Object.values(ptpMap).filter(date => date === null).length);
      
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

    console.log('=== PTP UPDATE ATTEMPT - ENHANCED ===');
    console.log('Application ID:', applicationId);
    console.log('User ID:', user.id);
    console.log('New PTP Date:', ptpDate);
    console.log('Is clearing date:', ptpDate === null || ptpDate === '');

    setLoading(true);
    try {
      // Validate input
      if (!applicationId || applicationId.trim() === '') {
        console.error('PTP Update Failed: Invalid application ID');
        return false;
      }

      // Validate date format if provided (not null/empty)
      if (ptpDate && ptpDate.trim() !== '') {
        const parsedDate = new Date(ptpDate);
        if (isNaN(parsedDate.getTime())) {
          console.error('PTP Update Failed: Invalid date format:', ptpDate);
          return false;
        }
      }

      // Convert empty string to null for clearing
      const finalPtpDate = (ptpDate && ptpDate.trim() !== '') ? ptpDate : null;

      console.log('Attempting to insert PTP date record...');
      console.log('Final PTP Date value:', finalPtpDate);
      
      // Insert the PTP date record with retry logic
      let insertAttempts = 0;
      const maxRetries = 3;
      let insertSuccess = false;

      while (insertAttempts < maxRetries && !insertSuccess) {
        insertAttempts++;
        console.log(`PTP Insert attempt ${insertAttempts}/${maxRetries}`);

        const { error: insertError, data: insertData } = await supabase
          .from('ptp_dates')
          .insert({
            application_id: applicationId,
            ptp_date: finalPtpDate,
            user_id: user.id
          })
          .select()
          .single();

        if (insertError) {
          console.error(`PTP Insert attempt ${insertAttempts} failed:`, insertError);
          if (insertAttempts < maxRetries) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } else {
          console.log(`✅ PTP Insert successful on attempt ${insertAttempts}:`, insertData);
          insertSuccess = true;
        }
      }

      if (!insertSuccess) {
        console.error('PTP Update Failed: All insert attempts failed');
        return false;
      }

      console.log('✅ PTP date record inserted successfully');
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
