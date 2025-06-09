
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FieldStatus } from '@/types/database';

export const useFieldStatus = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const fetchFieldStatus = useCallback(async (applicationIds: string[]) => {
    if (applicationIds.length === 0) return {};

    const { data, error } = await supabase
      .from('field_status')
      .select('*')
      .in('application_id', applicationIds);

    if (error) {
      console.error('Error fetching field status:', error);
      return {};
    }

    // Create a map of application_id -> status
    const statusMap: Record<string, string> = {};
    data?.forEach(status => {
      statusMap[status.application_id] = status.status;
    });

    return statusMap;
  }, []);

  const updateFieldStatus = useCallback(async (applicationId: string, newStatus: string) => {
    if (!user) return null;

    setLoading(true);
    try {
      // Check if field status exists
      const { data: existingStatus } = await supabase
        .from('field_status')
        .select('*')
        .eq('application_id', applicationId)
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
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('field_status')
          .insert({
            application_id: applicationId,
            status: newStatus,
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
