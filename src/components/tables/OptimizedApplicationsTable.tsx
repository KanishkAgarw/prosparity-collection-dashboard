
import { memo } from "react";
import { Application } from "@/types/application";
import TableHeader from "./TableHeader";
import ApplicationRow from "./ApplicationRow";
import { Table, TableBody } from "@/components/ui/table";

interface OptimizedApplicationsTableProps {
  applications: Application[];
  onRowClick: (application: Application) => void;
  onApplicationDeleted?: () => void;
  selectedApplicationId?: string;
}

const OptimizedApplicationsTable = memo(({
  applications,
  onRowClick,
  selectedApplicationId
}: OptimizedApplicationsTableProps) => {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader />
          <TableBody>
            {applications.map((application) => (
              <ApplicationRow
                key={application.id}
                application={application}
                selectedApplicationId={selectedApplicationId}
                onRowClick={onRowClick}
              />
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

OptimizedApplicationsTable.displayName = "OptimizedApplicationsTable";

export default OptimizedApplicationsTable;
