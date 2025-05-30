
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ContactCallingStatus {
  id: string;
  application_id: string;
  contact_type: string;
  status: string;
  user_id: string;
  user_email: string | null;
  created_at: string;
  updated_at: string;
}

export const useContactCallingStatus = (applicationId?: string) => {
  const { user } = useAuth();
  const [callingStatuses, setCallingStatuses] = useState<ContactCallingStatus[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCallingStatuses = async () => {
    if (!applicationId || !user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_calling_status')
        .select('*')
        .eq('application_id', applicationId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching calling statuses:', error);
      } else {
        setCallingStatuses(data || []);
      }
    } catch (error) {
      console.error('Error fetching calling statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCallingStatus = async (contactType: string, newStatus: string) => {
    if (!applicationId || !user) return;

    try {
      const { data, error } = await supabase
        .from('contact_calling_status')
        .upsert({
          application_id: applicationId,
          contact_type: contactType,
          status: newStatus,
          user_id: user.id,
          user_email: user.email,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'application_id,contact_type'
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating calling status:', error);
        return false;
      }

      await fetchCallingStatuses();
      return true;
    } catch (error) {
      console.error('Error updating calling status:', error);
      return false;
    }
  };

  const getStatusForContact = (contactType: string): string => {
    const status = callingStatuses.find(s => s.contact_type === contactType);
    return status?.status || 'Not Called';
  };

  useEffect(() => {
    if (applicationId && user) {
      fetchCallingStatuses();
    }
  }, [applicationId, user]);

  return {
    callingStatuses,
    loading,
    updateCallingStatus,
    getStatusForContact,
    refetch: fetchCallingStatuses
  };
};
