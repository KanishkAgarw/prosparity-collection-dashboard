
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FieldStatus } from '@/types/database';
import { getMonthVariations } from '@/utils/dateUtils';

export const useFieldStatus = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const fetchFieldStatus = useCallback(async (applicationIds: string[], selectedMonth?: string) => {
    if (applicationIds.length === 0 || !selectedMonth) return {};

    // Use month variations to handle different date formats
    const monthVariations = getMonthVariations(selectedMonth);
    console.log('Fetching field status with month variations:', monthVariations);

    const { data, error } = await supabase
      .from('field_status')
      .select('*')
      .in('application_id', applicationIds)
      .in('demand_date', monthVariations);

    if (error) {
      console.error('Error fetching field status:', error);
      return {};
    }

    // Create a map of application_id -> status (for the selected month)
    const statusMap: Record<string, string> = {};
    data?.forEach(status => {
      statusMap[status.application_id] = status.status;
    });

    return statusMap;
  }, []);

  const updateFieldStatus = useCallback(async (applicationId: string, newStatus: string, demandDate: string) => {
    if (!user || !demandDate) return null;

    setLoading(true);
    try {
      // Use month variations to find existing status
      const monthVariations = getMonthVariations(demandDate);
      
      // Check if field status exists for this month (using any of the variations)
      const { data: existingStatus } = await supabase
        .from('field_status')
        .select('*')
        .eq('application_id', applicationId)
        .in('demand_date', monthVariations)
        .maybeSingle();

      if (existingStatus) {
        // Update existing
        const { data, error } = await supabase
          .from('field_status')
          .update({
            status: newStatus,
            user_id: user.id,
            user_email: user.email,
            updated_at: new Date().toISOString()
          })
          .eq('application_id', applicationId)
          .eq('demand_date', existingStatus.demand_date) // Use the exact demand_date from existing record
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new - use the normalized month format
        const { data, error } = await supabase
          .from('field_status')
          .insert({
            application_id: applicationId,
            status: newStatus,
            demand_date: demandDate, // Use the passed demand date
            user_id: user.id,
            user_email: user.email
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
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
