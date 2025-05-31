
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Application } from "@/types/application";
import { AuditLog } from "@/hooks/useAuditLogs";
import { format } from "date-fns";
import { formatPtpDate } from "@/utils/formatters";
import { History } from "lucide-react";
import { useFilteredAuditLogs } from "@/hooks/useFilteredAuditLogs";
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
  
  // Update local state when application changes - IMPROVED
  useEffect(() => {
    console.log('=== STATUS TAB PTP DATE SYNC (IMPROVED) ===');
    console.log('Application PTP date:', application.ptp_date);
    console.log('Type of PTP date:', typeof application.ptp_date);
    
    if (application.ptp_date) {
      try {
        let dateForInput = '';
        
        // Handle different date formats more robustly
        if (typeof application.ptp_date === 'string') {
          let parsedDate: Date;
          
          // If it's already an ISO string or timestamp
          if (application.ptp_date.includes('T') || application.ptp_date.includes('Z')) {
            parsedDate = new Date(application.ptp_date);
          } 
          // If it's a YYYY-MM-DD format
          else if (application.ptp_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            parsedDate = new Date(application.ptp_date + 'T00:00:00.000Z');
          }
          // If it's a timestamp string
          else if (!isNaN(Number(application.ptp_date))) {
            parsedDate = new Date(Number(application.ptp_date));
          }
          // Try parsing as is
          else {
            parsedDate = new Date(application.ptp_date);
          }
          
          console.log('Parsed date object:', parsedDate);
          
          if (!isNaN(parsedDate.getTime())) {
            // Format for HTML date input (YYYY-MM-DD)
            dateForInput = parsedDate.toISOString().split('T')[0];
            console.log('Setting PTP date input to:', dateForInput);
            setPtpDate(dateForInput);
          } else {
            console.log('Invalid date, clearing input');
            setPtpDate('');
          }
        } else {
          console.log('PTP date is not a string, clearing input');
          setPtpDate('');
        }
      } catch (error) {
        console.error('Error parsing PTP date:', error);
        setPtpDate('');
      }
    } else {
      console.log('No PTP date, clearing input');
      setPtpDate('');
    }
  }, [application.ptp_date]);
  
  // Filter audit logs to only show status-related changes
  const statusOnlyLogs = useFilteredAuditLogs(auditLogs);

  const handlePtpDateChange = (value: string) => {
    console.log('=== STATUS TAB DATE CHANGE ===');
    console.log('Input value:', value);
    setPtpDate(value);
    onPtpDateChange(value);
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${format(date, 'dd-MMM-yyyy')} at ${format(date, 'HH:mm')}`;
    } catch {
      return dateStr;
    }
  };

  // Show only recent 2 status changes
  const recentStatusLogs = statusOnlyLogs.slice(0, 2);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Status Management</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Payment Status</Label>
              <Select value={application.status} onValueChange={onStatusChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                  <SelectItem value="Cash Collected from Customer">Cash Collected from Customer</SelectItem>
                  <SelectItem value="Customer Deposited to Bank">Customer Deposited to Bank</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                </SelectContent>
              </Select>
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
              />
              {ptpDate && (
                <div className="text-xs text-gray-500 mt-1">
                  Selected: {formatPtpDate(ptpDate + 'T00:00:00.000Z')}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Status Changes - Compact View */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Recent Status Changes
            </div>
            {statusOnlyLogs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogDialog(true)}
                className="text-xs h-7"
              >
                Log ({statusOnlyLogs.length})
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {recentStatusLogs.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-3">
              No status changes recorded yet
            </div>
          ) : (
            <div className="space-y-2">
              {recentStatusLogs.map((log) => (
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
        logs={statusOnlyLogs}
        title="Status Change History"
        type="audit"
      />
    </div>
  );
};

export default StatusTab;
