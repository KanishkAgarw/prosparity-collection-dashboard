import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfiles } from '@/hooks/useUserProfiles';

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
  demand_date?: string;
}

export const useCallingLogs = (applicationId?: string, selectedMonth?: string) => {
  const { user } = useAuth();
  const { fetchProfiles, getUserName } = useUserProfiles();
  const [rawCallingLogs, setRawCallingLogs] = useState<Omit<CallingLog, 'user_name'>[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCallingLogs = async () => {
    if (!applicationId || !user) return;
    
    setLoading(true);
    try {
      console.log('=== FETCHING CALLING LOGS ===');
      console.log('Application ID:', applicationId);
      console.log('Selected Month:', selectedMonth);
      
      // Build query with month filtering if selectedMonth is provided
      let query = supabase
        .from('calling_logs')
        .select('*')
        .eq('application_id', applicationId);

      // Add month filtering if selectedMonth is provided
      if (selectedMonth) {
        query = query.eq('demand_date', selectedMonth);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching calling logs:', error);
      } else {
        console.log('Fetched calling logs:', data);
        setRawCallingLogs(data || []);
        
        // Fetch profiles for all unique user IDs
        const userIds = [...new Set(data?.map(log => log.user_id) || [])];
        if (userIds.length > 0) {
          console.log('Fetching profiles for calling log users:', userIds);
          await fetchProfiles(userIds);
          // Small delay to ensure profiles are cached
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('Error fetching calling logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Memoize calling logs with user names to prevent unnecessary re-renders
  const callingLogs = useMemo(() => {
    return rawCallingLogs.map(log => {
      const userName = getUserName(log.user_id, log.user_email);
      console.log(`✓ Calling log ${log.id}: user_id=${log.user_id} -> resolved_name="${userName}"`);
      return {
        ...log,
        user_name: userName
      };
    });
  }, [rawCallingLogs, getUserName]);

  const addCallingLog = async (contactType: string, previousStatus: string | null, newStatus: string) => {
    if (!applicationId || !user || !selectedMonth) return;

    try {
      console.log('=== ADDING CALLING LOG ===');
      console.log('Application ID:', applicationId);
      console.log('Contact type:', contactType);
      console.log('Previous status:', previousStatus);
      console.log('New status:', newStatus);
      console.log('User ID:', user.id);
      console.log('User email:', user.email);
      console.log('Selected Month:', selectedMonth);
      
      const { error } = await supabase
        .from('calling_logs')
        .insert({
          application_id: applicationId,
          contact_type: contactType,
          previous_status: previousStatus,
          new_status: newStatus,
          user_id: user.id,
          user_email: user.email,
          demand_date: selectedMonth
        });

      if (error) {
        console.error('Error adding calling log:', error);
      } else {
        console.log('✓ Calling log added successfully');
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
  }, [applicationId, user, selectedMonth]);

  return {
    callingLogs,
    loading,
    addCallingLog,
    refetch: fetchCallingLogs
  };
};
