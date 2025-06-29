
import { useState, useEffect, useCallback } from 'react';
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
  demand_date: string;
}

// Helper function to normalize date format
const normalizeDate = (date: string | null | undefined): string | null => {
  if (!date) return null;
  
  try {
    if (date.length === 7) {
      // YYYY-MM format, convert to first day of month
      return `${date}-01`;
    } else if (date.length === 10) {
      // Already in YYYY-MM-DD format
      return date;
    } else {
      // Try to parse and format
      const parsedDate = new Date(date);
      return parsedDate.toISOString().split('T')[0];
    }
  } catch (error) {
    console.error('Error normalizing date:', error);
    return null;
  }
};

export const useContactCallingStatus = (applicationId?: string, selectedMonth?: string) => {
  const { user } = useAuth();
  const [callingStatuses, setCallingStatuses] = useState<ContactCallingStatus[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCallingStatuses = async () => {
    if (!applicationId || !user || !selectedMonth) return;
    
    const normalizedMonth = normalizeDate(selectedMonth);
    if (!normalizedMonth) {
      console.error('Invalid selectedMonth format:', selectedMonth);
      return;
    }

    setLoading(true);
    try {
      console.log('=== FETCHING CONTACT CALLING STATUSES ===');
      console.log('Application ID:', applicationId);
      console.log('Selected Month (normalized):', normalizedMonth);

      const { data, error } = await supabase
        .from('contact_calling_status')
        .select('*')
        .eq('application_id', applicationId)
        .eq('demand_date', normalizedMonth)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching calling statuses:', error);
        throw error;
      } else {
        console.log('✓ Fetched calling statuses:', data?.length || 0);
        setCallingStatuses(data || []);
      }
    } catch (error) {
      console.error('Exception in fetchCallingStatuses:', error);
      setCallingStatuses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchContactStatuses = useCallback(async (applicationIds: string[]): Promise<Record<string, Record<string, string>>> => {
    if (!user || applicationIds.length === 0) return {};
    
    try {
      console.log('=== FETCHING BATCH CONTACT STATUSES ===');
      console.log('Application IDs:', applicationIds.length);

      const { data, error } = await supabase
        .from('contact_calling_status')
        .select('application_id, contact_type, status, created_at')
        .in('application_id', applicationIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contact statuses:', error);
        return {};
      }

      // Group by application_id and get latest status for each contact type
      const statusMap: Record<string, Record<string, string>> = {};
      data?.forEach(status => {
        if (!statusMap[status.application_id]) {
          statusMap[status.application_id] = {};
        }
        
        // Only set if we don't already have a status for this contact type (keeps latest due to ordering)
        if (!statusMap[status.application_id][status.contact_type]) {
          statusMap[status.application_id][status.contact_type] = status.status;
        }
      });

      // Add latest calling status for each application
      Object.keys(statusMap).forEach(appId => {
        const statuses = Object.values(statusMap[appId]);
        if (statuses.length > 0) {
          // Find the most recent non-"Not Called" status, or "Not Called" if all are
          const activeStatuses = statuses.filter(s => s !== 'Not Called');
          statusMap[appId].latest = activeStatuses.length > 0 ? activeStatuses[0] : 'No Calls';
        } else {
          statusMap[appId].latest = 'No Calls';
        }
      });

      console.log('✓ Processed contact statuses for', Object.keys(statusMap).length, 'applications');
      return statusMap;
    } catch (error) {
      console.error('Error fetching contact statuses:', error);
      return {};
    }
  }, [user]);

  const updateCallingStatus = async (contactType: string, newStatus: string) => {
    if (!applicationId || !user || !selectedMonth) {
      console.error('Missing required parameters for updateCallingStatus');
      return false;
    }

    const normalizedMonth = normalizeDate(selectedMonth);
    if (!normalizedMonth) {
      console.error('Invalid selectedMonth format for updateCallingStatus:', selectedMonth);
      return false;
    }

    try {
      console.log('=== UPDATING CONTACT CALLING STATUS ===');
      console.log('Application ID:', applicationId);
      console.log('Contact Type:', contactType);
      console.log('New Status:', newStatus);
      console.log('Demand Date (normalized):', normalizedMonth);

      const { data, error } = await supabase
        .from('contact_calling_status')
        .upsert({
          application_id: applicationId,
          contact_type: contactType,
          status: newStatus,
          user_id: user.id,
          user_email: user.email,
          demand_date: normalizedMonth,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'application_id,contact_type,demand_date'
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating calling status:', error);
        throw error;
      }

      console.log('✓ Contact calling status updated successfully:', data);
      await fetchCallingStatuses();
      return true;
    } catch (error) {
      console.error('Exception in updateCallingStatus:', error);
      return false;
    }
  };

  const getStatusForContact = (contactType: string): string => {
    const status = callingStatuses.find(s => s.contact_type === contactType);
    return status?.status || 'Not Called';
  };

  const refetch = fetchCallingStatuses;

  useEffect(() => {
    if (applicationId && user && selectedMonth) {
      fetchCallingStatuses();
    }
  }, [applicationId, user, selectedMonth]);

  return {
    callingStatuses,
    loading,
    updateCallingStatus,
    getStatusForContact,
    refetch,
    fetchContactStatuses
  };
};
