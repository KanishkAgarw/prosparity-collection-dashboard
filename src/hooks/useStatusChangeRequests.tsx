
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface StatusChangeRequest {
  id: string;
  application_id: string;
  requester_id: string;
  requester_email?: string;
  requested_status: string;
  current_status?: string;
  request_reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_comment?: string;
  created_at: string;
  updated_at: string;
}

export const useStatusChangeRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<StatusChangeRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('status_change_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching status change requests:', error);
        return;
      }

      setRequests(data || []);
    } catch (error) {
      console.error('Error in fetchRequests:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createRequest = async (
    applicationId: string,
    requestedStatus: string,
    currentStatus?: string,
    reason?: string
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('status_change_requests')
        .insert({
          application_id: applicationId,
          requester_id: user.id,
          requester_email: user.email,
          requested_status: requestedStatus,
          current_status: currentStatus,
          request_reason: reason
        })
        .select()
        .single();

      if (error) throw error;

      await fetchRequests();
      return data;
    } catch (error) {
      console.error('Error creating status change request:', error);
      throw error;
    }
  };

  const reviewRequest = async (
    requestId: string,
    decision: 'approved' | 'rejected',
    comment?: string
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('status_change_requests')
        .update({
          status: decision,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_comment: comment
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      await fetchRequests();
      return data;
    } catch (error) {
      console.error('Error reviewing status change request:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    loading,
    createRequest,
    reviewRequest,
    refetch: fetchRequests
  };
};
