
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { formatEmiMonth, formatCurrency } from "@/utils/formatters";

interface Application {
  id: string;
  applicant_id: string;
  applicant_name: string;
  applicant_mobile?: string;
  branch_name: string;
  team_lead: string;
  rm_name: string;
  dealer_name: string;
  lender_name: string;
  status: string;
  emi_amount: number;
  demand_date?: string;
  ptp_date?: string;
  rm_comments?: string;
  co_applicant_name?: string;
  co_applicant_mobile?: string;
  guarantor_name?: string;
  guarantor_mobile?: string;
  latest_calling_status?: string;
}

interface ApplicationsTableProps {
  applications: Application[];
  onRowClick: (application: Application) => void;
  onApplicationDeleted?: () => void;
  selectedApplicationId?: string;
}

const getStatusBadge = (status: string) => {
  const variants = {
    'Paid': 'bg-green-100 text-green-800 border-green-200',
    'Unpaid': 'bg-red-100 text-red-800 border-red-200',
    'Partially Paid': 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };
  
  return (
    <Badge className={`${variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800 border-gray-200'} border`}>
      {status}
    </Badge>
  );
};

const getCallingStatusBadge = (status?: string) => {
  if (!status) return <span className="text-gray-400 text-xs">No Status</span>;
  
  const variants = {
    'Called': 'bg-green-100 text-green-800 border-green-200',
    'Not Called': 'bg-gray-100 text-gray-800 border-gray-200',
    'No Response': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Busy': 'bg-orange-100 text-orange-800 border-orange-200',
    'Disconnected': 'bg-red-100 text-red-800 border-red-200'
  };
  
  return (
    <Badge className={`${variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800 border-gray-200'} border text-xs`}>
      {status}
    </Badge>
  );
};

const formatPtpDate = (ptpDate?: string) => {
  if (!ptpDate) return "NA";
  try {
    return formatEmiMonth(ptpDate);
  } catch {
    return "NA";
  }
};

const ApplicationsTable = ({ applications, onRowClick, onApplicationDeleted, selectedApplicationId }: ApplicationsTableProps) => {
  const { user } = useAuth();
  const isAdmin = user?.email === 'kanishk@prosparity.in';

  const handleDelete = async (applicationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    
    if (!confirm(`Are you sure you want to delete application ${applicationId}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('applicant_id', applicationId);

      if (error) {
        console.error('Error deleting application:', error);
        toast.error('Failed to delete application');
      } else {
        toast.success('Application deleted successfully');
        onApplicationDeleted?.();
      }
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Failed to delete application');
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[320px]">Details</TableHead>
              <TableHead className="min-w-[120px]">EMI Due</TableHead>
              <TableHead className="min-w-[120px]">Status</TableHead>
              <TableHead className="min-w-[140px]">Latest Calling Status</TableHead>
              <TableHead className="min-w-[100px]">PTP Date</TableHead>
              {isAdmin && <TableHead className="min-w-[80px]">Actions</TableHead>}
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
                onClick={() => onRowClick(app)}
              >
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
                      <span className="font-medium"> Lender:</span> {app.lender_name}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium text-blue-600">{formatCurrency(app.emi_amount)}</TableCell>
                <TableCell>{getStatusBadge(app.status)}</TableCell>
                <TableCell>{getCallingStatusBadge(app.latest_calling_status)}</TableCell>
                <TableCell className={`${app.ptp_date ? 'text-blue-600 font-medium' : 'text-gray-400'} whitespace-nowrap`}>
                  {formatPtpDate(app.ptp_date)}
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(app.applicant_id, e)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ApplicationsTable;
