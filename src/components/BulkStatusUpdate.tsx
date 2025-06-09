
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Application } from '@/types/application';
import { useFieldStatus } from '@/hooks/useFieldStatus';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface BulkStatusUpdateProps {
  selectedApplications: Application[];
  onUpdate: () => void;
  onCancel: () => void;
}

const BulkStatusUpdate = ({ selectedApplications, onUpdate, onCancel }: BulkStatusUpdateProps) => {
  const { user } = useAuth();
  const { updateFieldStatus } = useFieldStatus();
  const { addAuditLog } = useAuditLogs();
  const [newStatus, setNewStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBulkUpdate = async () => {
    if (!newStatus || !user) return;

    setLoading(true);
    try {
      const updatePromises = selectedApplications.map(async (app) => {
        const previousStatus = app.field_status || 'Unpaid';
        
        // Update field status
        await updateFieldStatus(app.applicant_id, newStatus);
        
        // Add audit log
        await addAuditLog(app.applicant_id)(
          'Status (Bulk Update)',
          previousStatus,
          newStatus
        );
      });

      await Promise.all(updatePromises);
      
      toast.success(`Successfully updated status for ${selectedApplications.length} applications`);
      onUpdate();
    } catch (error) {
      console.error('Error in bulk status update:', error);
      toast.error('Failed to update status for some applications');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    'Unpaid',
    'Partially Paid',
    'Cash Collected from Customer',
    'Customer Deposited to Bank',
    'Paid'
  ];

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Bulk Status Update</span>
          <Badge variant="secondary">{selectedApplications.length} selected</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Update Status To:</label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleBulkUpdate}
              disabled={!newStatus || loading}
              className="flex-1"
              size="sm"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update {selectedApplications.length} Applications
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkStatusUpdate;
