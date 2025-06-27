import { useMemo, useState } from "react";
import { Application, RepaymentHistory, AuditLog } from "@/types/application";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VEHICLE_STATUS_OPTIONS } from "@/constants/options";
import { format } from "date-fns";
import { History } from "lucide-react";
import { Button } from "../ui/button";
import LogDialog from "./LogDialog";
import { formatEmiMonth } from "@/utils/formatters";

const getVehicleStatusColor = (status: string | undefined) => {
    return VEHICLE_STATUS_OPTIONS.find(o => o.value === status)?.color || "bg-gray-400 text-white";
};

const DetailItem = ({ label, value }: { label: string; value: string | number | undefined }) => (
    <div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-800 break-words">{value || 'N/A'}</p>
    </div>
);

const DetailsTab = ({
  application,
  repaymentHistory,
  auditLogs,
  onVehicleStatusChange,
  monthlyData,
}: {
  application: Application | null;
  repaymentHistory: RepaymentHistory[];
  auditLogs: AuditLog[];
  onVehicleStatusChange: (newStatus: string) => void;
  monthlyData?: any[];
}) => {
  const [showLogDialog, setShowLogDialog] = useState(false);

  if (!application) {
    return <div>Loading...</div>;
  }

  const vehicleStatusLogs = useMemo(() => {
    if (!auditLogs) return [];
    return auditLogs
      .filter(log => log.field === 'Vehicle Status')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [auditLogs]);

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${format(date, 'dd-MMM-yy')} at ${format(date, 'HH:mm')}`;
    } catch {
      return dateStr;
    }
  };

  const repaymentHistoryString = repaymentHistory
    .sort((a, b) => a.repayment_number - b.repayment_number)
    .map(h => h.delay_in_days)
    .join(' | ');

  const monthlyProgression = monthlyData
    ?.sort((a, b) => a.demand_date.localeCompare(b.demand_date))
    .map(item => {
      const amount = item.emi_amount || 0;
      const status = item.lms_status || 'Unknown';
      return `${formatEmiMonth(item.demand_date)}: ₹${amount.toLocaleString()} (${status})`;
    })
    .join(' → ');

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Loan & Repayment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8">
            <DetailItem label="Application ID" value={application.applicant_id} />
            <DetailItem label="Loan Amount" value={application.loan_amount ? `₹${application.loan_amount.toLocaleString()}`: 'N/A'} />
            <DetailItem label="Disbursement Date" value={application.disbursement_date} />
            <DetailItem label="EMI" value={application.emi_amount ? `₹${application.emi_amount.toLocaleString()}`: 'N/A'} />
            <DetailItem label="Repayment Number" value={application.repayment} />
            <DetailItem label="House Ownership" value={application.house_ownership} />
            <div className="col-span-2 md:col-span-3">
                <DetailItem label="Repayment History (Delay in Days)" value={repaymentHistoryString || "No history"} />
            </div>
            {monthlyData && monthlyData.length > 1 && (
              <div className="col-span-2 md:col-span-3">
                <DetailItem label="Monthly Progression (EMI & Status)" value={monthlyProgression || "No progression data"} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assignment & Status</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8">
                <DetailItem label="RM Name" value={application.rm_name} />
                <DetailItem label="Collection RM" value={application.collection_rm} />
                <DetailItem label="Team Lead" value={application.team_lead} />
                <DetailItem label="Branch" value={application.branch_name} />
                <DetailItem label="Dealer" value={application.dealer_name} />
                <DetailItem label="Lender" value={application.lender_name} />
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Vehicle Status</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
            <div className="w-64">
                <Select
                    value={application.vehicle_status || 'None'}
                    onValueChange={(value) => onVehicleStatusChange(value === 'None' ? '' : value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select vehicle status..." />
                    </SelectTrigger>
                    <SelectContent>
                        {VEHICLE_STATUS_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {application.vehicle_status && application.vehicle_status !== 'None' && (
                <Badge className={`${getVehicleStatusColor(application.vehicle_status)}`}>
                    {application.vehicle_status}
                </Badge>
            )}
        </CardContent>
      </Card>

      {/* Vehicle Status Change History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Vehicle Status History
            </div>
            {vehicleStatusLogs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogDialog(true)}
                className="text-xs h-7"
              >
                Log ({vehicleStatusLogs.length})
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {vehicleStatusLogs.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-3">
              No changes recorded yet
            </div>
          ) : (
            <div className="space-y-2">
              {vehicleStatusLogs.slice(0, 2).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div className="flex-1">
                    <span className="font-medium text-blue-700 capitalize">
                      {log.field}
                    </span>
                    <div className="text-xs text-gray-600">
                      <span className="text-red-600">{log.previous_value || 'None'}</span>
                      {' → '}
                      <span className="text-green-600">{log.new_value || 'None'}</span>
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

      {/* Log Dialog for Vehicle Status */}
      <LogDialog
        open={showLogDialog}
        onClose={() => setShowLogDialog(false)}
        logs={vehicleStatusLogs}
        title="Vehicle Status Change History"
        type="audit"
      />
    </div>
  );
};

export default DetailsTab; 