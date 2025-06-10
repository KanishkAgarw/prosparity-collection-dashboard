
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfiles } from '@/hooks/useUserProfiles';

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
  const { fetchProfiles, getUserName } = useUserProfiles();
  const [rawAuditLogs, setRawAuditLogs] = useState<Omit<AuditLog, 'user_name'>[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAuditLogs = async () => {
    if (!applicationId || !user) return;
    
    setLoading(true);
    try {
      console.log('=== FETCHING AUDIT LOGS ===');
      console.log('Application ID:', applicationId);
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching audit logs:', error);
      } else {
        console.log('Fetched audit logs:', data);
        setRawAuditLogs(data || []);
        
        // Fetch profiles for all unique user IDs
        const userIds = [...new Set(data?.map(log => log.user_id) || [])];
        if (userIds.length > 0) {
          console.log('Fetching profiles for audit log users:', userIds);
          await fetchProfiles(userIds);
        }
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Memoize audit logs with user names to prevent unnecessary re-renders
  const auditLogs = useMemo(() => {
    return rawAuditLogs.map(log => {
      const userName = getUserName(log.user_id, log.user_email);
      console.log(`✓ Audit log ${log.id}: user_id=${log.user_id} -> resolved_name="${userName}"`);
      return {
        ...log,
        user_name: userName
      };
    });
  }, [rawAuditLogs, getUserName]);

  // Updated function signature to accept applicationId as first parameter
  const addAuditLog = async (appId: string, field: string, previousValue: string | null, newValue: string | null) => {
    if (!user) return;

    try {
      console.log('=== ADDING AUDIT LOG ===');
      console.log('Application ID:', appId);
      console.log('Field:', field);
      console.log('Previous value:', previousValue);
      console.log('New value:', newValue);
      console.log('User ID:', user.id);
      console.log('User email:', user.email);
      
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          field,
          previous_value: previousValue,
          new_value: newValue,
          application_id: appId,
          user_id: user.id,
          user_email: user.email
        });

      if (error) {
        console.error('Error adding audit log:', error);
      } else {
        console.log('✓ Audit log added successfully');
        // Only refresh if this log is for the current application
        if (appId === applicationId) {
          await fetchAuditLogs();
        }
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
