
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
    if (!user) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('ptp_dates')
        .insert({
          application_id: applicationId,
          ptp_date: ptpDate,
          user_id: user.id
        });

      if (error) {
        console.error('Error updating PTP date:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating PTP date:', error);
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
