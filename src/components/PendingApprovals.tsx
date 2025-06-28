
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUserProfiles } from '@/hooks/useUserProfiles';

interface StatusChangeRequest {
  id: string;
  application_id: string;
  current_status: string;
  requested_status: string;
  request_timestamp: string;
  requested_by_name: string;
  requested_by_email: string;
  demand_date: string;
}

interface PendingApprovalsProps {
  onClose: () => void;
}

const PendingApprovals = ({ onClose }: PendingApprovalsProps) => {
  const { user } = useAuth();
  const { fetchProfiles, profilesCache } = useUserProfiles();
  const userProfile = profilesCache.get(user?.id || '');
  const [requests, setRequests] = useState<StatusChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectionComments, setRejectionComments] = useState<{ [key: string]: string }>({});

  const refetchRequests = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('status_change_requests')
        .select('*')
        .eq('approval_status', 'pending');

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      toast.error('Failed to fetch pending status change requests');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refetchRequests();
      if (user && user.id) {
        fetchProfiles([user.id]);
      }
    }
  }, [user, refetchRequests, fetchProfiles]);

  const handleApprove = async (requestId: string) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      // Update the request status
      const { error: updateError } = await supabase
        .from('status_change_requests')
        .update({
          approval_status: 'approved' as const,
          reviewed_by_user_id: user?.id,
          reviewed_by_email: user?.email,
          reviewed_by_name: userProfile?.full_name || user?.email,
          review_timestamp: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Update the field status
      const { error: statusError } = await supabase
        .from('field_status')
        .upsert({
          application_id: request.application_id,
          status: request.requested_status,
          user_id: user?.id || '',
          user_email: user?.email || '',
          demand_date: request.demand_date,
          updated_at: new Date().toISOString(),
        });

      if (statusError) throw statusError;

      // Create audit log
      await supabase
        .from('audit_logs')
        .insert({
          application_id: request.application_id,
          field: 'status',
          previous_value: request.current_status,
          new_value: request.requested_status,
          user_id: user?.id || '',
          user_email: user?.email || '',
          demand_date: request.demand_date,
        });

      toast.success('Status change approved successfully');
      refetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve status change');
    }
  };

  const handleReject = async (requestId: string, comments: string) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      const { error } = await supabase
        .from('status_change_requests')
        .update({
          approval_status: 'rejected' as const,
          reviewed_by_user_id: user?.id,
          reviewed_by_email: user?.email,
          reviewed_by_name: userProfile?.full_name || user?.email,
          review_timestamp: new Date().toISOString(),
          review_comments: comments,
        })
        .eq('id', requestId);

      if (error) throw error;

      // Create audit log for rejection
      await supabase
        .from('audit_logs')
        .insert({
          application_id: request.application_id,
          field: 'status_request_rejected',
          previous_value: request.current_status,
          new_value: `Rejected: ${request.requested_status}`,
          user_id: user?.id || '',
          user_email: user?.email || '',
          demand_date: request.demand_date,
        });

      toast.success('Status change rejected');
      refetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject status change');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 px-4">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-semibold">Pending Status Change Requests</h2>
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application ID</TableHead>
                <TableHead>Current Status</TableHead>
                <TableHead>Requested Status</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Request Timestamp</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.application_id}</TableCell>
                  <TableCell>{request.current_status}</TableCell>
                  <TableCell>{request.requested_status}</TableCell>
                  <TableCell>{request.requested_by_name} ({request.requested_by_email})</TableCell>
                  <TableCell>{new Date(request.request_timestamp).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprove(request.id)}
                      >
                        Approve
                      </Button>
                      <div className="flex flex-col space-y-2">
                        <Textarea
                          placeholder="Rejection comments"
                          value={rejectionComments[request.id] || ''}
                          onChange={(e) => setRejectionComments({ ...rejectionComments, [request.id]: e.target.value })}
                          className="max-w-xs"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleReject(request.id, rejectionComments[request.id] || '')}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;
