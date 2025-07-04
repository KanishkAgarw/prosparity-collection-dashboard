
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FieldStatus } from '@/types/database';
import { getMonthDateRange } from '@/utils/dateUtils';

export const useFieldStatus = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const fetchFieldStatus = useCallback(async (applicationIds: string[], selectedMonth?: string) => {
    if (applicationIds.length === 0 || !selectedMonth) return {};

    // Use date range for the selected month
    const { start, end } = getMonthDateRange(selectedMonth);
    console.log('Fetching field status for month range:', start, 'to', end);

    const { data, error } = await supabase
      .from('field_status')
      .select('*')
      .in('application_id', applicationIds)
      .gte('demand_date', start)
      .lte('demand_date', end)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching field status:', error);
      return {};
    }

    // Create a map of application_id -> status (latest record per application)
    const statusMap: Record<string, string> = {};
    const processedApps = new Set<string>();
    
    data?.forEach(status => {
      if (!processedApps.has(status.application_id)) {
        statusMap[status.application_id] = status.status;
        processedApps.add(status.application_id);
      }
    });

    return statusMap;
  }, []);

  const updateFieldStatus = useCallback(async (applicationId: string, newStatus: string, demandDate: string) => {
    if (!user || !demandDate) return null;

    setLoading(true);
    try {
      // Convert YYYY-MM to actual EMI date (5th of the month)
      const emiDate = demandDate.match(/^\d{4}-\d{2}$/) 
        ? `${demandDate}-05` 
        : demandDate;

      console.log('Updating field status:', { applicationId, newStatus, emiDate });

      const updateData = {
        application_id: applicationId,
        status: newStatus,
        demand_date: emiDate,
        user_id: user.id,
        user_email: user.email,
        updated_at: new Date().toISOString()
      };

      // Use upsert with the correct conflict resolution
      const { data, error } = await supabase
        .from('field_status')
        .upsert(updateData, {
          onConflict: 'application_id,demand_date',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating field status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating field status:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    fetchFieldStatus,
    updateFieldStatus,
    loading
  };
};
