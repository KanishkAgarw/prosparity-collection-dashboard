
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CallingLog {
  id: string;
  application_id: string;
  contact_type: string;
  previous_status: string | null;
  new_status: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  created_at: string;
}

export const useCallingLogs = (applicationId?: string) => {
  const { user } = useAuth();
  const [callingLogs, setCallingLogs] = useState<CallingLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCallingLogs = async () => {
    if (!applicationId || !user) return;
    
    setLoading(true);
    try {
      console.log('Fetching calling logs for application:', applicationId);
      
      const { data, error } = await supabase
        .from('calling_logs')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching calling logs:', error);
      } else {
        console.log('Fetched calling logs:', data);
        
        // Fetch user names separately
        const userIds = [...new Set(data?.map(log => log.user_id) || [])];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
        
        const logsWithNames = data?.map(log => ({
          ...log,
          user_name: profileMap.get(log.user_id) || log.user_email || 'Unknown User'
        })) || [];
        setCallingLogs(logsWithNames);
      }
    } catch (error) {
      console.error('Error fetching calling logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCallingLog = async (contactType: string, previousStatus: string | null, newStatus: string) => {
    if (!applicationId || !user) return;

    try {
      console.log('Adding calling log for application:', applicationId, { contactType, previousStatus, newStatus });
      
      const { error } = await supabase
        .from('calling_logs')
        .insert({
          application_id: applicationId,
          contact_type: contactType,
          previous_status: previousStatus,
          new_status: newStatus,
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || user.email
        });

      if (error) {
        console.error('Error adding calling log:', error);
      } else {
        console.log('Added calling log successfully');
        await fetchCallingLogs(); // Refresh calling logs
      }
    } catch (error) {
      console.error('Error adding calling log:', error);
    }
  };

  useEffect(() => {
    if (applicationId && user) {
      fetchCallingLogs();
    }
  }, [applicationId, user]);

  return {
    callingLogs,
    loading,
    addCallingLog,
    refetch: fetchCallingLogs
  };
};
