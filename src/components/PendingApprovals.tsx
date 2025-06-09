
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useStatusChangeRequests, StatusChangeRequest } from '@/hooks/useStatusChangeRequests';
import { useFieldStatus } from '@/hooks/useFieldStatus';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { formatPtpDate } from '@/utils/formatters';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';

interface PendingApprovalsProps {
  onUpdate?: () => void;
}

const PendingApprovals = ({ onUpdate }: PendingApprovalsProps) => {
  const { requests, reviewRequest, loading } = useStatusChangeRequests();
  const { updateFieldStatus } = useFieldStatus();
  const { addAuditLog } = useAuditLogs();
  const [reviewComment, setReviewComment] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<StatusChangeRequest | null>(null);

  const pendingRequests = requests.filter(req => req.status === 'pending');

  const handleApprove = async (request: StatusChangeRequest) => {
    try {
      // First approve the request
      await reviewRequest(request.id, 'approved', reviewComment);
      
      // Then update the actual field status
      await updateFieldStatus(request.application_id, request.requested_status);
      
      // Add audit log for the approval - fix the function call
      const logFunction = addAuditLog(request.application_id);
      await logFunction(
        'Status (Approved)',
        request.current_status || 'Unpaid',
        request.requested_status
      );

      toast.success(`Status change approved for application ${request.application_id}`);
      setReviewComment('');
      setSelectedRequest(null);
      onUpdate?.();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve status change');
    }
  };

  const handleReject = async (request: StatusChangeRequest) => {
    try {
      await reviewRequest(request.id, 'rejected', reviewComment);
      
      // Add audit log for the rejection - fix the function call
      const logFunction = addAuditLog(request.application_id);
      await logFunction(
        'Status Change Rejected',
        request.current_status || 'Unpaid',
        `Rejected request for ${request.requested_status}`
      );

      toast.success(`Status change rejected for application ${request.application_id}`);
      setReviewComment('');
      setSelectedRequest(null);
      onUpdate?.();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject status change');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'approved': 'bg-green-100 text-green-800 border-green-200',
      'rejected': 'bg-red-100 text-red-800 border-red-200'
    };
    
    return (
      <Badge className={`${variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800 border-gray-200'} border`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">Loading pending approvals...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pending Status Approvals
          {pendingRequests.length > 0 && (
            <Badge variant="secondary">{pendingRequests.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingRequests.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No pending status change requests
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-blue-900">
                      Application: {request.application_id}
                    </div>
                    <div className="text-sm text-gray-600">
                      Requested by: {request.requester_email}
                    </div>
                    <div className="text-sm text-gray-600">
                      Requested: {formatPtpDate(request.created_at)}
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="mb-3">
                  <div className="text-sm">
                    <span className="font-medium">Status Change:</span>
                    <span className="text-red-600 ml-1">{request.current_status || 'Unpaid'}</span>
                    <span className="mx-2">→</span>
                    <span className="text-green-600">{request.requested_status}</span>
                  </div>
                  {request.request_reason && (
                    <div className="text-sm mt-1">
                      <span className="font-medium">Reason:</span> {request.request_reason}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Review Status Change Request</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong>Application ID:</strong> {request.application_id}
                          </div>
                          <div>
                            <strong>Requested By:</strong> {request.requester_email}
                          </div>
                          <div>
                            <strong>Current Status:</strong> {request.current_status || 'Unpaid'}
                          </div>
                          <div>
                            <strong>Requested Status:</strong> {request.requested_status}
                          </div>
                        </div>
                        
                        {request.request_reason && (
                          <div>
                            <strong>Reason:</strong>
                            <p className="mt-1 text-sm text-gray-600">{request.request_reason}</p>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Review Comment (Optional)
                          </label>
                          <Textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Add a comment about your decision..."
                            rows={3}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApprove(request)}
                            className="flex-1"
                            size="sm"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleReject(request)}
                            className="flex-1"
                            size="sm"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingApprovals;
