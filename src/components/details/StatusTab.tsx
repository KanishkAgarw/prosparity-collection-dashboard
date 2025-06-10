
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Application } from "@/types/application";
import { AuditLog } from "@/hooks/useAuditLogs";
import { format } from "date-fns";
import { formatPtpDate } from "@/utils/formatters";
import { History, Clock, AlertCircle } from "lucide-react";
import { useFilteredAuditLogs } from "@/hooks/useFilteredAuditLogs";
import { toast } from "sonner";
import LogDialog from "./LogDialog";

interface StatusTabProps {
  application: Application;
  auditLogs: AuditLog[];
  onStatusChange: (newStatus: string) => void;
  onPtpDateChange: (newDate: string) => void;
}

const StatusTab = ({ application, auditLogs, onStatusChange, onPtpDateChange }: StatusTabProps) => {
  const [ptpDate, setPtpDate] = useState('');
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [isUpdatingPtp, setIsUpdatingPtp] = useState(false);
  
  // PTP date synchronization - optimized to reduce re-renders
  useEffect(() => {
    if (application.ptp_date) {
      try {
        let inputValue = '';
        
        if (typeof application.ptp_date === 'string') {
          let parsedDate: Date;
          
          // Handle different date formats
          if (application.ptp_date.includes('T') || application.ptp_date.includes('Z')) {
            // ISO string format
            parsedDate = new Date(application.ptp_date);
          } else if (application.ptp_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // YYYY-MM-DD format
            parsedDate = new Date(application.ptp_date + 'T00:00:00.000Z');
          } else {
            // Try parsing as generic date
            parsedDate = new Date(application.ptp_date);
          }
          
          if (!isNaN(parsedDate.getTime())) {
            // Format for HTML date input (YYYY-MM-DD)
            inputValue = parsedDate.toISOString().split('T')[0];
          }
        }
        
        setPtpDate(inputValue);
      } catch (error) {
        console.error('Error parsing PTP date:', error);
        setPtpDate('');
      }
    } else {
      setPtpDate('');
    }
  }, [application.ptp_date]);
  
  // Use the hook directly without wrapping in useMemo
  const statusAndPtpLogs = useFilteredAuditLogs(auditLogs);

  const handlePtpDateChange = async (value: string) => {
    console.log('=== PTP DATE INPUT CHANGE ===');
    console.log('Application:', application.applicant_name);
    console.log('Input value:', value);
    
    setPtpDate(value);
    setIsUpdatingPtp(true);

    try {
      console.log('Calling onPtpDateChange with value:', value);
      await onPtpDateChange(value);
      
      // Show success message
      if (value) {
        const formattedDisplayDate = formatPtpDate(value + 'T00:00:00.000Z');
        toast.success(`PTP date updated to ${formattedDisplayDate}`);
      } else {
        toast.success('PTP date cleared');
      }
    } catch (error) {
      console.error('Error updating PTP date:', error);
      toast.error('Failed to update PTP date. Please try again.');
      
      // Revert the input value on error
      if (application.ptp_date) {
        try {
          const parsedDate = new Date(application.ptp_date);
          if (!isNaN(parsedDate.getTime())) {
            setPtpDate(parsedDate.toISOString().split('T')[0]);
          }
        } catch (revertError) {
          console.error('Error reverting PTP date:', revertError);
          setPtpDate('');
        }
      } else {
        setPtpDate('');
      }
    } finally {
      setIsUpdatingPtp(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    onStatusChange(newStatus);
  };

  // Optimized date formatting function
  const formatDateTime = useMemo(() => {
    return (dateStr: string) => {
      try {
        const date = new Date(dateStr);
        return `${format(date, 'dd-MMM-yyyy')} at ${format(date, 'HH:mm')}`;
      } catch {
        return dateStr;
      }
    };
  }, []);

  // Show only recent 2 status/PTP changes
  const recentStatusAndPtpLogs = useMemo(() => {
    return Array.isArray(statusAndPtpLogs) ? statusAndPtpLogs.slice(0, 2) : [];
  }, [statusAndPtpLogs]);

  // Get the 5 basic status options
  const getStatusOptions = () => {
    return [
      { value: "Unpaid", label: "Unpaid" },
      { value: "Partially Paid", label: "Partially Paid" },
      { value: "Cash Collected from Customer", label: "Cash Collected from Customer" },
      { value: "Customer Deposited to Bank", label: "Customer Deposited to Bank" },
      { value: "Paid", label: "Paid" }
    ];
  };

  // Check if status is pending approval
  const isPendingApproval = application.field_status?.includes('Pending Approval');
  const currentStatus = application.field_status || 'Unpaid';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Status Management</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              {isPendingApproval ? (
                <div className="mt-1 space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <div className="flex-1">
                      <div className="font-medium text-yellow-800">
                        {currentStatus}
                      </div>
                      <div className="text-sm text-yellow-600">
                        This status change is awaiting admin approval
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      Pending
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    Status cannot be changed while approval is pending
                  </div>
                </div>
              ) : (
                <Select 
                  value={currentStatus} 
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getStatusOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div>
              <Label htmlFor="ptpDate">
                PTP Date {application.ptp_date && `(Current: ${formatPtpDate(application.ptp_date)})`}
              </Label>
              <Input
                id="ptpDate"
                type="date"
                value={ptpDate}
                onChange={(e) => handlePtpDateChange(e.target.value)}
                className="mt-1"
                disabled={isUpdatingPtp}
              />
              {isUpdatingPtp && (
                <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  Updating PTP date...
                </div>
              )}
              {ptpDate && !isUpdatingPtp && (
                <div className="text-xs text-gray-500 mt-1">
                  Selected: {formatPtpDate(ptpDate + 'T00:00:00.000Z')}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Status & PTP Changes - Compact View */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Recent Changes
            </div>
            {Array.isArray(statusAndPtpLogs) && statusAndPtpLogs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogDialog(true)}
                className="text-xs h-7"
              >
                Log ({statusAndPtpLogs.length})
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {recentStatusAndPtpLogs.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-3">
              No status or PTP date changes recorded yet
            </div>
          ) : (
            <div className="space-y-2">
              {recentStatusAndPtpLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div className="flex-1">
                    <span className="font-medium text-blue-700">{log.field}</span>
                    <div className="text-xs text-gray-600">
                      <span className="text-red-600">{log.previous_value || 'Not Set'}</span>
                      {' → '}
                      <span className="text-green-600">{log.new_value || 'Not Set'}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    <div>{formatDateTime(log.created_at)}</div>
                    <div>by {log.user_name || 'Unknown'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Dialog */}
      <LogDialog
        open={showLogDialog}
        onClose={() => setShowLogDialog(false)}
        logs={Array.isArray(statusAndPtpLogs) ? statusAndPtpLogs : []}
        title="Status & PTP Date History"
        type="audit"
      />
    </div>
  );
};

export default StatusTab;
