
import { memo, useMemo, useCallback } from "react";
import { Table, TableBody } from "@/components/ui/table";
import { Application } from "@/types/application";
import TableHeader from "./TableHeader";
import ApplicationRow from "./ApplicationRow";

interface OptimizedApplicationsTableProps {
  applications: Application[];
  onRowClick: (application: Application) => void;
  selectedApplicationId?: string;
  selectedApplications?: Application[];
  onSelectionChange?: (applications: Application[]) => void;
  showBulkSelection?: boolean;
}

const OptimizedApplicationsTable = memo(({ 
  applications, 
  onRowClick, 
  selectedApplicationId,
  selectedApplications = [],
  onSelectionChange,
  showBulkSelection = false
}: OptimizedApplicationsTableProps) => {

  const handleSelectAll = useCallback((checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(checked ? applications : []);
    }
  }, [onSelectionChange, applications]);

  const handleSelectApplication = useCallback((application: Application, checked: boolean) => {
    if (!onSelectionChange) return;
    
    if (checked) {
      onSelectionChange([...selectedApplications, application]);
    } else {
      onSelectionChange(selectedApplications.filter(app => app.id !== application.id));
    }
  }, [onSelectionChange, selectedApplications]);

  const isApplicationSelected = useCallback((application: Application) => {
    return selectedApplications.some(app => app.id === application.id);
  }, [selectedApplications]);

  const { allSelected, someSelected } = useMemo(() => {
    const allSelected = applications.length > 0 && selectedApplications.length === applications.length;
    const someSelected = selectedApplications.length > 0 && selectedApplications.length < applications.length;
    return { allSelected, someSelected };
  }, [applications.length, selectedApplications.length]);

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader
            showBulkSelection={showBulkSelection}
            allSelected={allSelected}
            someSelected={someSelected}
            onSelectAll={handleSelectAll}
          />
          <TableBody>
            {applications.map((app) => (
              <ApplicationRow
                key={app.id}
                application={app}
                isSelected={isApplicationSelected(app)}
                showBulkSelection={showBulkSelection}
                selectedApplicationId={selectedApplicationId}
                onRowClick={onRowClick}
                onSelectApplication={handleSelectApplication}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

OptimizedApplicationsTable.displayName = "OptimizedApplicationsTable";

export default OptimizedApplicationsTable;
