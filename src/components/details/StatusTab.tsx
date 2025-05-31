
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
  
  // ENHANCED PTP date synchronization with comprehensive debugging
  useEffect(() => {
    console.log('=== PTP DATE SYNC EFFECT (ENHANCED) ===');
    console.log('Application:', application.applicant_name);
    console.log('Application ID:', application.applicant_id);
    console.log('Raw PTP date from application:', application.ptp_date);
    console.log('Type of PTP date:', typeof application.ptp_date);
    
    if (application.ptp_date) {
      try {
        let inputValue = '';
        
        if (typeof application.ptp_date === 'string') {
          let parsedDate: Date;
          
          // Handle different date formats
          if (application.ptp_date.includes('T') || application.ptp_date.includes('Z')) {
            // ISO string format
            parsedDate = new Date(application.ptp_date);
            console.log('Parsed as ISO string:', parsedDate);
          } else if (application.ptp_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // YYYY-MM-DD format
            parsedDate = new Date(application.ptp_date + 'T00:00:00.000Z');
            console.log('Parsed as YYYY-MM-DD:', parsedDate);
          } else {
            // Try parsing as generic date
            parsedDate = new Date(application.ptp_date);
            console.log('Parsed as generic date:', parsedDate);
          }
          
          console.log('Final parsed date:', parsedDate);
          console.log('Is valid date:', !isNaN(parsedDate.getTime()));
          
          if (!isNaN(parsedDate.getTime())) {
            // Format for HTML date input (YYYY-MM-DD)
            inputValue = parsedDate.toISOString().split('T')[0];
            console.log('Setting HTML input value:', inputValue);
          } else {
            console.log('Invalid date parsed, clearing input');
            inputValue = '';
          }
        }
        
        setPtpDate(inputValue);
        console.log('✓ PTP date state updated to:', inputValue);
      } catch (error) {
        console.error('Error parsing PTP date:', error);
        setPtpDate('');
      }
    } else {
      console.log('No PTP date, clearing input');
      setPtpDate('');
    }
  }, [application.ptp_date, application.applicant_id, application.applicant_name]);
  
  // Filter audit logs to only show status-related changes
  const statusOnlyLogs = useFilteredAuditLogs(auditLogs);

  const handlePtpDateChange = (value: string) => {
    console.log('=== PTP DATE INPUT CHANGE (ENHANCED) ===');
    console.log('Application:', application.applicant_name);
    console.log('Input value:', value);
    console.log('Current state value:', ptpDate);
    
    setPtpDate(value);
    onPtpDateChange(value);
    
    console.log('✓ PTP date change handlers called');
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
              <div className="text-xs text-gray-400 mt-1">
                Debug - Input value: "{ptpDate}" | DB value: "{application.ptp_date || 'null'}"
              </div>
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
