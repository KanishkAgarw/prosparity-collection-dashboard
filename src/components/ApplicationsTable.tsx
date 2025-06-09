import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { formatEmiMonth, formatCurrency, formatPtpDate } from "@/utils/formatters";
import { Application } from "@/types/application";
import CallStatusDisplay from "./CallStatusDisplay";

interface ApplicationsTableProps {
  applications: Application[];
  onRowClick: (application: Application) => void;
  onApplicationDeleted?: () => void;
  selectedApplicationId?: string;
  selectedApplications?: Application[];
  onSelectionChange?: (applications: Application[]) => void;
  showBulkSelection?: boolean;
}

const getStatusBadge = (status: string) => {
  const variants = {
    'Unpaid': 'bg-red-100 text-red-800 border-red-200',
    'Partially Paid': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Cash Collected from Customer': 'bg-orange-100 text-orange-800 border-orange-200',
    'Customer Deposited to Bank': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Paid': 'bg-green-100 text-green-800 border-green-200'
  };
  
  return (
    <Badge className={`${variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800 border-gray-200'} border`}>
      {status}
    </Badge>
  );
};

// Helper function to display lender name
const formatLenderName = (lenderName: string) => {
  if (lenderName === 'Vivriti Capital Limited') {
    return 'Vivriti';
  }
  return lenderName;
};

const ApplicationsTable = ({ 
  applications, 
  onRowClick, 
  selectedApplicationId,
  selectedApplications = [],
  onSelectionChange,
  showBulkSelection = false
}: ApplicationsTableProps) => {

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    onSelectionChange(checked ? applications : []);
  };

  const handleSelectApplication = (application: Application, checked: boolean) => {
    if (!onSelectionChange) return;
    
    if (checked) {
      onSelectionChange([...selectedApplications, application]);
    } else {
      onSelectionChange(selectedApplications.filter(app => app.id !== application.id));
    }
  };

  const isApplicationSelected = (application: Application) => {
    return selectedApplications.some(app => app.id === application.id);
  };

  const allSelected = applications.length > 0 && selectedApplications.length === applications.length;
  const someSelected = selectedApplications.length > 0 && selectedApplications.length < applications.length;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {showBulkSelection && (
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    className={someSelected ? "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground opacity-50" : ""}
                  />
                </TableHead>
              )}
              <TableHead className="min-w-[320px]">Details</TableHead>
              <TableHead className="min-w-[120px]">EMI Due</TableHead>
              <TableHead className="min-w-[120px]">Status</TableHead>
              <TableHead className="min-w-[100px]">PTP Date</TableHead>
              <TableHead className="min-w-[150px]">Call Status</TableHead>
              <TableHead className="min-w-[200px]">Recent Comments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow 
                key={app.id} 
                className={`cursor-pointer transition-colors ${
                  selectedApplicationId === app.id 
                    ? 'bg-blue-50 border-l-4 border-l-blue-500 hover:bg-blue-100' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={(e) => {
                  if (!showBulkSelection || !(e.target as HTMLElement).closest('input[type="checkbox"]')) {
                    onRowClick(app);
                  }
                }}
              >
                {showBulkSelection && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isApplicationSelected(app)}
                      onCheckedChange={(checked) => handleSelectApplication(app, checked as boolean)}
                    />
                  </TableCell>
                )}
                <TableCell className="py-3">
                  <div className="space-y-1">
                    <div className="font-semibold text-blue-900">{app.applicant_name}</div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">ID:</span> {app.applicant_id}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">EMI Month:</span> {formatEmiMonth(app.demand_date)} | 
                      <span className="font-medium"> Branch:</span> {app.branch_name}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">TL:</span> {app.team_lead} | 
                      <span className="font-medium"> RM:</span> {app.rm_name}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Dealer:</span> {app.dealer_name} | 
                      <span className="font-medium"> Lender:</span> {formatLenderName(app.lender_name)}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium text-blue-600">{formatCurrency(app.emi_amount)}</TableCell>
                <TableCell>{getStatusBadge(app.field_status || 'Unpaid')}</TableCell>
                <TableCell className={`${app.ptp_date ? 'text-blue-600 font-medium' : 'text-gray-400'} whitespace-nowrap`}>
                  {app.ptp_date ? formatPtpDate(app.ptp_date) : 'Not Set'}
                </TableCell>
                <TableCell className="text-sm">
                  <CallStatusDisplay application={app} />
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <div className="space-y-1">
                    {app.recent_comments && app.recent_comments.length > 0 ? (
                      app.recent_comments.map((comment, index) => (
                        <div key={index} className="text-xs p-2 rounded bg-gray-50 border-l-2 border-blue-200">
                          <div className="font-medium text-blue-700 mb-1">{comment.user_name}</div>
                          <div className="text-gray-600 break-words">{comment.content}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-400 italic">No comments</div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ApplicationsTable;
