
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AuditLog {
  id: string;
  field: string;
  previous_value: string | null;
  new_value: string | null;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  application_id: string;
  created_at: string;
}

export const useAuditLogs = (applicationId?: string) => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAuditLogs = async () => {
    if (!applicationId || !user) return;
    
    setLoading(true);
    try {
      console.log('Fetching audit logs for application:', applicationId);
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching audit logs:', error);
      } else {
        console.log('Fetched audit logs:', data);
        
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
        setAuditLogs(logsWithNames);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAuditLog = async (field: string, previousValue: string | null, newValue: string | null) => {
    if (!applicationId || !user) return;

    try {
      console.log('Adding audit log for application:', applicationId, { field, previousValue, newValue });
      
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          field,
          previous_value: previousValue,
          new_value: newValue,
          application_id: applicationId,
          user_id: user.id,
          user_email: user.email
        });

      if (error) {
        console.error('Error adding audit log:', error);
      } else {
        console.log('Added audit log successfully');
        await fetchAuditLogs(); // Refresh audit logs
      }
    } catch (error) {
      console.error('Error adding audit log:', error);
    }
  };

  useEffect(() => {
    if (applicationId && user) {
      fetchAuditLogs();
    }
  }, [applicationId, user]);

  return {
    auditLogs,
    loading,
    addAuditLog,
    refetch: fetchAuditLogs
  };
};
