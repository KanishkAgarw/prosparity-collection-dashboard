
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Application {
  applicationId: string;
  applicantName: string;
  branch: string;
  teamLead: string;
  rm: string;
  dealer: string;
  lender: string;
  status: string;
  emiDue: number;
  demandMonth: string;
  paidDate?: string;
  ptpDate?: string;
  rmComments?: string;
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

const formatPtpDate = (ptpDate?: string) => {
  if (!ptpDate) return "NA";
  try {
    return format(new Date(ptpDate), 'dd-MMM-yy');
  } catch {
    return "NA";
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const ApplicationsTable = ({ applications, onRowClick, onApplicationDeleted, selectedApplicationId }: ApplicationsTableProps) => {
  const handleDelete = async (applicationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    
    if (!confirm(`Are you sure you want to delete application ${applicationId}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('application_id', applicationId);

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
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[120px]">Application ID</TableHead>
            <TableHead className="min-w-[100px]">EMI Month</TableHead>
            <TableHead className="min-w-[150px]">Applicant</TableHead>
            <TableHead className="min-w-[100px]">Branch</TableHead>
            <TableHead className="min-w-[120px]">Team Lead</TableHead>
            <TableHead className="min-w-[100px]">RM</TableHead>
            <TableHead className="min-w-[100px]">Dealer</TableHead>
            <TableHead className="min-w-[100px]">Lender</TableHead>
            <TableHead className="min-w-[100px]">EMI Due</TableHead>
            <TableHead className="min-w-[120px]">Status</TableHead>
            <TableHead className="min-w-[100px]">PTP Date</TableHead>
            <TableHead className="min-w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => (
            <TableRow 
              key={app.applicationId} 
              className={`cursor-pointer transition-colors ${
                selectedApplicationId === app.applicationId 
                  ? 'bg-blue-50 border-l-4 border-l-blue-500 hover:bg-blue-100' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onRowClick(app)}
            >
              <TableCell className="font-medium">{app.applicationId}</TableCell>
              <TableCell className="font-medium">{app.demandMonth}</TableCell>
              <TableCell>{app.applicantName}</TableCell>
              <TableCell>{app.branch}</TableCell>
              <TableCell>{app.teamLead}</TableCell>
              <TableCell>{app.rm}</TableCell>
              <TableCell>{app.dealer}</TableCell>
              <TableCell>{app.lender}</TableCell>
              <TableCell className="font-medium text-blue-600">{formatCurrency(app.emiDue)}</TableCell>
              <TableCell>{getStatusBadge(app.status)}</TableCell>
              <TableCell className={`${app.ptpDate ? 'text-blue-600 font-medium' : 'text-gray-400'} whitespace-nowrap`}>
                {formatPtpDate(app.ptpDate)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleDelete(app.applicationId, e)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ApplicationsTable;
