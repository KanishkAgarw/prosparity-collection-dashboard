
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Application } from "@/types/application";
import { AuditLog } from "@/hooks/useAuditLogs";
import { format } from "date-fns";
import { formatPtpDate } from "@/utils/formatters";

interface StatusTabProps {
  application: Application;
  auditLogs: AuditLog[];
  onStatusChange: (newStatus: string) => void;
  onPtpDateChange: (newDate: string) => void;
}

const StatusTab = ({ application, auditLogs, onStatusChange, onPtpDateChange }: StatusTabProps) => {
  const [ptpDate, setPtpDate] = useState(application.ptp_date ? application.ptp_date.split('T')[0] : '');

  const handlePtpDateChange = (value: string) => {
    setPtpDate(value);
    onPtpDateChange(value);
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${format(date, 'dd-MMM-yy')} at ${format(date, 'HH:mm')}`;
    } catch {
      return dateStr;
    }
  };

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
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="ptpDate">PTP Date</Label>
              <Input
                id="ptpDate"
                type="date"
                value={ptpDate}
                onChange={(e) => handlePtpDateChange(e.target.value)}
                className="mt-1"
              />
              {application.ptp_date && (
                <p className="text-xs text-gray-500 mt-1">
                  Current: {formatPtpDate(application.ptp_date)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {auditLogs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Change History</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-3 bg-gray-50 text-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-blue-700">{log.field}</span>
                    <span className="text-xs text-gray-500">
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs">
                      <span className="text-gray-600">From:</span>{' '}
                      <span className="text-red-600">{log.previous_value || 'Not Set'}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-600">To:</span>{' '}
                      <span className="text-green-600">{log.new_value || 'Not Set'}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Changed by: {log.user_name || 'Unknown User'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StatusTab;
