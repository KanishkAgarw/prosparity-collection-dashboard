
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { toast } from "sonner";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";

interface StatusChangeRequest {
  id: string;
  application_id: string;
  requested_status: string;
  current_status: string;
  requested_by_user_id: string;
  requested_by_email: string | null;
  requested_by_name: string | null;
  request_timestamp: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  reviewed_by_user_id: string | null;
  reviewed_by_email: string | null;
  reviewed_by_name: string | null;
  review_timestamp: string | null;
  review_comments: string | null;
  // Application details
  applicant_name?: string;
  applicant_id?: string;
}

interface PendingApprovalsProps {
  onUpdate: () => void;
}

const PendingApprovals = ({ onUpdate }: PendingApprovalsProps) => {
  const { user } = useAuth();
  const { getUserName } = useUserProfiles();
  const [requests, setRequests] = useState<StatusChangeRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});
  const [isOpen, setIsOpen] = useState(() => {
    // Load saved state from localStorage
    const saved = localStorage.getItem('pendingApprovalsOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Save toggle state to localStorage
  useEffect(() => {
    localStorage.setItem('pendingApprovalsOpen', JSON.stringify(isOpen));
  }, [isOpen]);

  const fetchPendingRequests = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // First get the status change requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('status_change_requests')
        .select('*')
        .eq('approval_status', 'pending')
        .order('request_timestamp', { ascending: false });

      if (requestsError) {
        console.error('Error fetching pending requests:', requestsError);
        toast.error('Failed to fetch pending requests');
        return;
      }

      if (!requestsData || requestsData.length === 0) {
        setRequests([]);
        return;
      }

      // Get application details for each request
      const applicationIds = requestsData.map(req => req.application_id);
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select('applicant_id, applicant_name')
        .in('applicant_id', applicationIds);

      if (applicationsError) {
        console.error('Error fetching applications:', applicationsError);
        toast.error('Failed to fetch application details');
        return;
      }

      // Combine the data
      const requestsWithAppDetails = requestsData.map(request => {
        const appDetails = applicationsData?.find(app => app.applicant_id === request.application_id);
        return {
          ...request,
          applicant_name: appDetails?.applicant_name,
          applicant_id: appDetails?.applicant_id
        };
      });

      setRequests(requestsWithAppDetails);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      toast.error('Failed to fetch pending requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, [user]);

  const handleApproval = async (requestId: string, action: 'approved' | 'rejected') => {
    if (!user) return;

    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      const comments = reviewComments[requestId] || '';

      // Update the status change request
      const { error: requestError } = await supabase
        .from('status_change_requests')
        .update({
          approval_status: action,
          reviewed_by_user_id: user.id,
          reviewed_by_email: user.email,
          reviewed_by_name: getUserName(user.id, user.email),
          review_timestamp: new Date().toISOString(),
          review_comments: comments || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (requestError) {
        console.error('Error updating request:', requestError);
        toast.error('Failed to update request');
        return;
      }

      if (action === 'approved') {
        // Update field_status to the requested status
        const { error: statusError } = await supabase
          .from('field_status')
          .update({
            status: request.requested_status,
            requested_status: null,
            status_approval_needed: false,
            updated_at: new Date().toISOString()
          })
          .eq('application_id', request.application_id);

        if (statusError) {
          console.error('Error updating field status:', statusError);
          toast.error('Failed to update application status');
          return;
        }

        // Add audit log for approval
        const { error: auditError } = await supabase
          .from('audit_logs')
          .insert({
            application_id: request.application_id,
            field: 'Status',
            previous_value: `${request.current_status} (Pending Approval)`,
            new_value: request.requested_status,
            user_id: user.id,
            user_email: user.email
          });

        if (auditError) {
          console.error('Error adding audit log:', auditError);
        }

        toast.success(`Status change approved and updated to ${request.requested_status}`);
      } else {
        // Revert field_status to previous status
        const { error: statusError } = await supabase
          .from('field_status')
          .update({
            status: request.current_status,
            requested_status: null,
            status_approval_needed: false,
            updated_at: new Date().toISOString()
          })
          .eq('application_id', request.application_id);

        if (statusError) {
          console.error('Error reverting field status:', statusError);
          toast.error('Failed to revert application status');
          return;
        }

        // Add audit log for rejection
        const { error: auditError } = await supabase
          .from('audit_logs')
          .insert({
            application_id: request.application_id,
            field: 'Status',
            previous_value: `${request.requested_status} (Pending Approval)`,
            new_value: request.current_status,
            user_id: user.id,
            user_email: user.email
          });

        if (auditError) {
          console.error('Error adding audit log:', auditError);
        }

        toast.success('Status change rejected and reverted');
      }

      // Refresh the requests and trigger parent update
      await fetchPendingRequests();
      onUpdate();
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error('Failed to process approval');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Status Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading pending requests...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Status Approvals
                {requests.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {requests.length}
                  </Badge>
                )}
              </div>
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No pending requests</div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="font-semibold text-blue-900">
                          {request.applicant_name} ({request.applicant_id})
                        </div>
                        <div className="text-sm text-gray-600">
                          Requested by: {request.requested_by_name || request.requested_by_email}
                        </div>
                        <div className="text-sm text-gray-600">
                          Requested: {format(new Date(request.request_timestamp), 'dd-MMM-yyyy HH:mm')}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                        Pending Approval
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">Status Change:</span>
                      <span className="px-2 py-1 bg-red-50 text-red-700 rounded">{request.current_status}</span>
                      <span>→</span>
                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded">{request.requested_status}</span>
                    </div>

                    <div className="space-y-2">
                      <Textarea
                        placeholder="Add review comments (optional)"
                        value={reviewComments[request.id] || ''}
                        onChange={(e) => setReviewComments(prev => ({
                          ...prev,
                          [request.id]: e.target.value
                        }))}
                        className="text-sm"
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproval(request.id, 'approved')}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleApproval(request.id, 'rejected')}
                        className="flex items-center gap-1"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default PendingApprovals;
