
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Application } from "@/types/application";

interface ApplicationsTableProps {
  applications: Application[];
  onRowClick: (application: Application) => void;
}

const getStatusBadge = (status: string) => {
  const variants = {
    'Paid': 'bg-green-100 text-green-800',
    'Unpaid': 'bg-red-100 text-red-800',
    'Partially Paid': 'bg-yellow-100 text-yellow-800',
    'Overdue': 'bg-orange-100 text-orange-800'
  };
  
  return (
    <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
      {status}
    </Badge>
  );
};

const ApplicationsTable = ({ applications, onRowClick }: ApplicationsTableProps) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Application ID</TableHead>
            <TableHead>Applicant</TableHead>
            <TableHead className="hidden md:table-cell">Branch</TableHead>
            <TableHead className="hidden md:table-cell">Team Lead</TableHead>
            <TableHead className="hidden lg:table-cell">RM</TableHead>
            <TableHead className="hidden lg:table-cell">Dealer</TableHead>
            <TableHead className="hidden lg:table-cell">Lender</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">EMI Due</TableHead>
            <TableHead className="hidden md:table-cell">Amount Paid</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => (
            <TableRow 
              key={app.applicationId} 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => onRowClick(app)}
            >
              <TableCell className="font-medium">{app.applicationId}</TableCell>
              <TableCell>{app.applicantName}</TableCell>
              <TableCell className="hidden md:table-cell">{app.branch}</TableCell>
              <TableCell className="hidden md:table-cell">{app.teamLead}</TableCell>
              <TableCell className="hidden lg:table-cell">{app.rm}</TableCell>
              <TableCell className="hidden lg:table-cell">{app.dealer}</TableCell>
              <TableCell className="hidden lg:table-cell">{app.lender}</TableCell>
              <TableCell>{getStatusBadge(app.status)}</TableCell>
              <TableCell className="hidden md:table-cell">₹{app.emiDue.toLocaleString()}</TableCell>
              <TableCell className="hidden md:table-cell">₹{app.amountPaid.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ApplicationsTable;
