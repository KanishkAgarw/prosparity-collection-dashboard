
import { User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${format(date, 'dd-MMM-yy')} at ${format(date, 'HH:mm')}`;
    } catch {
      return dateStr;
    }
  };

  const formatAuditValue = (value: string | null, field: string) => {
    if (!value) return "Not set";
    
    if (field === 'PTP Date' && value !== 'Not set') {
      try {
        if (value.includes('T') || value.includes('-')) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return format(date, 'dd-MMM-yy');
          }
        }
        return value;
      } catch {
        return value;
      }
    }
    
    return value;
  };

  const statusAndPtpLogs = auditLogs.filter(log => 
    ['Status', 'PTP Date', 'Amount Paid'].includes(log.field)
  ) || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-sm">Status & Payment</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{statusAndPtpLogs.length} logs</span>
            {statusAndPtpLogs.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs">
                    View Logs
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-sm sm:text-base">Audit Trail ({statusAndPtpLogs.length} entries)</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    {statusAndPtpLogs.map((log) => (
                      <div key={log.id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-sm">{log.user_name || 'Unknown User'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{formatDateTime(log.created_at)}</span>
                          </div>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">{log.field}</span> changed
                          <div className="mt-1 text-xs text-gray-600">
                            From: <span className="bg-red-100 px-1 rounded break-all">{formatAuditValue(log.previous_value, log.field)}</span>
                            {" → "}
                            To: <span className="bg-green-100 px-1 rounded break-all">{formatAuditValue(log.new_value, log.field)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={application.status} onValueChange={onStatusChange}>
            <SelectTrigger>
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
          <Label htmlFor="ptpDate">Promise to Pay Date</Label>
          <Input
            id="ptpDate"
            type="date"
            value={application.ptp_date || ''}
            onChange={(e) => onPtpDateChange(e.target.value)}
          />
          {application.ptp_date && (
            <p className="text-xs text-gray-500 mt-1">
              Formatted: {formatPtpDate(application.ptp_date)}
            </p>
          )}
        </div>

        {/* Recent Changes */}
        {statusAndPtpLogs.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-xs text-gray-500 mb-2">Recent Changes:</p>
            <div className="space-y-2">
              {statusAndPtpLogs.slice(0, 2).map((log) => (
                <div key={log.id} className="text-xs border-l-2 border-blue-200 pl-2 py-1 bg-blue-50">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                    <span className="font-medium">{log.field}</span>
                    <span className="text-gray-500">by {log.user_name || 'Unknown User'}</span>
                  </div>
                  <div className="text-gray-400">{formatDateTime(log.created_at)}</div>
                  <div className="text-xs mt-1 break-words">
                    <span className="bg-red-100 px-1 rounded">{formatAuditValue(log.previous_value, log.field)}</span>
                    {" → "}
                    <span className="bg-green-100 px-1 rounded">{formatAuditValue(log.new_value, log.field)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {statusAndPtpLogs.length === 0 && (
          <div className="text-xs text-gray-400 italic">No changes recorded yet</div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatusTab;
