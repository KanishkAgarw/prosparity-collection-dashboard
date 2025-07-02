
import { memo } from "react";
import { Application } from "@/types/application";
import TableHeader from "./TableHeader";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import StatusBadge from "./StatusBadge";

interface SimpleApplicationsTableProps {
  applications: Application[];
  onRowClick: (application: Application) => void;
  selectedApplicationId?: string;
}

const SimpleApplicationsTable = memo(({
  applications,
  onRowClick,
  selectedApplicationId
}: SimpleApplicationsTableProps) => {

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader />
          <TableBody>
            {applications.map((application) => (
              <TableRow
                key={application.id}
                className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedApplicationId === application.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => onRowClick(application)}
              >
                <TableCell className="font-medium text-sm">
                  {application.applicant_name}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {application.applicant_id}
                </TableCell>
                <TableCell className="text-sm">
                  {application.branch_name}
                </TableCell>
                <TableCell className="text-sm">
                  {application.team_lead}
                </TableCell>
                <TableCell className="text-sm">
                  {application.rm_name}
                </TableCell>
                <TableCell className="text-sm">
                  {application.dealer_name}
                </TableCell>
                <TableCell className="text-sm">
                  {application.lender_name}
                </TableCell>
                <TableCell>
                  <StatusBadge status={application.lms_status} />
                </TableCell>
                <TableCell className="text-sm font-medium">
                  ₹{application.emi_amount?.toLocaleString() || '0'}
                </TableCell>
                <TableCell className="text-sm">
                  ₹{application.principle_due?.toLocaleString() || '0'}
                </TableCell>
                <TableCell className="text-sm">
                  ₹{application.interest_due?.toLocaleString() || '0'}
                </TableCell>
                <TableCell className="text-sm">
                  {application.demand_date ? new Date(application.demand_date).toLocaleDateString() : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {applications.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium text-gray-500">No applications found</p>
          <p className="text-sm text-gray-400">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
});

SimpleApplicationsTable.displayName = "SimpleApplicationsTable";

export default SimpleApplicationsTable;
