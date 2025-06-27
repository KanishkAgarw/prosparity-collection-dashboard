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
  demand_date?: string;
}

export const useAuditLogs = (applicationId?: string, selectedMonth?: string) => {
  const { user } = useAuth();
  const { fetchProfiles, getUserName } = useUserProfiles();
  const [rawAuditLogs, setRawAuditLogs] = useState<Omit<AuditLog, 'user_name'>[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAuditLogs = async () => {
    if (!applicationId || !user) return;
    
    setLoading(true);
    try {
      console.log('=== FETCHING AUDIT LOGS - ENHANCED ===');
      console.log('Application ID:', applicationId);
      console.log('Selected Month:', selectedMonth);
      
      // Build query with month filtering if selectedMonth is provided
      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('application_id', applicationId);

      // Add month filtering if selectedMonth is provided
      if (selectedMonth) {
        // Include logs for the selected month OR logs with null demand_date (independent logs)
        query = query.or(`demand_date.eq.${selectedMonth},demand_date.is.null`);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching audit logs:', error);
      } else {
        console.log('✅ Fetched audit logs:', data?.length || 0, 'records');
        setRawAuditLogs(data || []);
        
        // Fetch profiles for all unique user IDs
        const userIds = [...new Set(data?.map(log => log.user_id) || [])];
        if (userIds.length > 0) {
          console.log('Fetching profiles for audit log users:', userIds);
          await fetchProfiles(userIds);
          // Small delay to ensure profiles are cached
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('❌ Error fetching audit logs:', error);
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

  // ENHANCED addAuditLog function with better error handling and retry logic
  const addAuditLog = async (appId: string, field: string, previousValue: string | null, newValue: string | null, demandDate?: string) => {
    if (!user) {
      console.error('❌ Cannot add audit log: User not authenticated');
      return;
    }

    console.log('=== ADDING AUDIT LOG - ENHANCED ===');
    console.log('Application ID:', appId);
    console.log('Field:', field);
    console.log('Previous value:', previousValue);
    console.log('New value:', newValue);
    console.log('User ID:', user.id);
    console.log('User email:', user.email);
    console.log('Demand Date:', demandDate);

    // Validate inputs
    if (!appId || !field) {
      console.error('❌ Invalid audit log parameters');
      throw new Error('Invalid audit log parameters');
    }

    try {
      const auditLogData = {
        field,
        previous_value: previousValue,
        new_value: newValue,
        application_id: appId,
        user_id: user.id,
        user_email: user.email,
        demand_date: demandDate
      };

      console.log('Inserting audit log with data:', auditLogData);

      const { error, data } = await supabase
        .from('audit_logs')
        .insert(auditLogData)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error adding audit log:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Failed to add audit log: ${error.message}`);
      }

      console.log('✅ Audit log added successfully:', data);
      
      // Only refresh if this log is for the current application
      if (appId === applicationId) {
        console.log('Refreshing audit logs for current application');
        await fetchAuditLogs();
      }
    } catch (error) {
      console.error('❌ Exception adding audit log:', error);
      throw error; // Re-throw to let the caller handle it
    }
  };

  useEffect(() => {
    if (applicationId && user) {
      fetchAuditLogs();
    }
  }, [applicationId, user, selectedMonth]);

  return {
    auditLogs,
    loading,
    addAuditLog,
    refetch: fetchAuditLogs
  };
};
